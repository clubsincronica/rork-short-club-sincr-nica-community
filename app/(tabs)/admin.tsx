import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/utils/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Users, DollarSign, TrendingUp, MessageSquare } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';

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
                setError('No se encontró token de autenticación');
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
                const errorData = await statsResponse.json();
                setError(errorData.error || 'No tienes permisos de administrador');
            }

            // Load recent users
            const usersResponse = await fetch(`${getApiBaseUrl()}/api/admin/users?page=1&limit=10`, { headers });
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users || []);
            }

        } catch (err: any) {
            console.error('Admin data load error:', err);
            setError(err.message || 'Error al cargar datos de administrador');
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
                    <Shield size={48} color={Colors.error} />
                    <Text style={styles.errorTitle}>Acceso Denegado</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.errorHint}>
                        Solo usuarios con rol "superuser" pueden acceder al panel de administración.
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadAdminData}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
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
                <Shield size={28} color={Colors.gold} />
                <Text style={styles.headerTitle}>Panel de Administración</Text>
            </View>

            {stats && (
                <>
                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
                            <Users size={24} color="white" />
                            <Text style={styles.statValue}>{stats.users?.total || 0}</Text>
                            <Text style={styles.statLabel}>Usuarios</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: Colors.accent }]}>
                            <MessageSquare size={24} color="white" />
                            <Text style={styles.statValue}>{stats.conversations?.total || 0}</Text>
                            <Text style={styles.statLabel}>Conversaciones</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: Colors.goldDark }]}>
                            <DollarSign size={24} color="white" />
                            <Text style={styles.statValue}>{stats.transactions?.total || 0}</Text>
                            <Text style={styles.statLabel}>Transacciones</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: Colors.secondaryLight }]}>
                            <TrendingUp size={24} color="white" />
                            <Text style={styles.statValue}>
                                ${stats.revenue?.total?.toFixed(2) || '0.00'}
                            </Text>
                            <Text style={styles.statLabel}>Ingresos ({stats.revenue?.currency})</Text>
                        </View>
                    </View>

                    {/* Recent Users */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Usuarios Recientes</Text>
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
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginLeft: 12,
        color: Colors.text,
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
        shadowColor: Colors.shadow,
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
        backgroundColor: Colors.white,
        margin: 10,
        padding: 15,
        borderRadius: 12,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        color: Colors.text,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.surface,
        borderRadius: 8,
        marginBottom: 8,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    userEmail: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    userMeta: {
        alignItems: 'flex-end',
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    superuserRole: {
        color: Colors.error,
    },
    userId: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        paddingTop: 100,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.error,
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        marginTop: 8,
    },
    errorHint: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
