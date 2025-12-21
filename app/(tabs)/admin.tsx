import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/utils/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Users, DollarSign, TrendingUp, MessageSquare } from '@/components/SmartIcons';

export default function AdminScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState('');

    const loadAdminData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Load stats
            const statsResponse = await fetch(`${getApiBaseUrl()}/api/admin/stats`, { headers });
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            } else {
                setError('Failed to load statistics');
            }

            // Load recent users
            const usersResponse = await fetch(`${getApiBaseUrl()}/api/admin/users?page=1&limit=10`, { headers });
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users || []);
            }

        } catch (err: any) {
            console.error('Admin data load error:', err);
            setError(err.message || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Shield size={48} color="#e74c3c" />
                    <Text style={styles.errorTitle}>Access Error</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadAdminData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadAdminData} />
            }
        >
            <View style={styles.header}>
                <Shield size={32} color="#3498db" />
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>

            {stats && (
                <>
                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
                            <Users size={24} color="white" />
                            <Text style={styles.statValue}>{stats.users?.total || 0}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
                            <MessageSquare size={24} color="white" />
                            <Text style={styles.statValue}>{stats.conversations?.total || 0}</Text>
                            <Text style={styles.statLabel}>Conversations</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#e67e22' }]}>
                            <DollarSign size={24} color="white" />
                            <Text style={styles.statValue}>{stats.transactions?.total || 0}</Text>
                            <Text style={styles.statLabel}>Transactions</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
                            <TrendingUp size={24} color="white" />
                            <Text style={styles.statValue}>
                                ${stats.revenue?.total?.toFixed(2) || '0.00'}
                            </Text>
                            <Text style={styles.statLabel}>Revenue ({stats.revenue?.currency})</Text>
                        </View>
                    </View>

                    {/* Recent Users */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Users</Text>
                        {users.map((user) => (
                            <View key={user.id} style={styles.userCard}>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{user.name}</Text>
                                    <Text style={styles.userEmail}>{user.email}</Text>
                                </View>
                                <View style={styles.userMeta}>
                                    <Text style={[
                                        styles.userRole,
                                        user.role === 'superuser' && styles.superuserRole
                                    ]}>
                                        {user.role || 'user'}
                                    </Text>
                                    <Text style={styles.userId}>ID: {user.id}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 12,
        color: '#333',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    statCard: {
        width: '48%',
        margin: '1%',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        margin: 10,
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    userEmail: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    userMeta: {
        alignItems: 'flex-end',
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3498db',
        textTransform: 'uppercase',
    },
    superuserRole: {
        color: '#e74c3c',
    },
    userId: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#3498db',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
