import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/utils/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Users, DollarSign, TrendingUp, MessageSquare } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';

export default function AdminScreen() {
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [commissionRate, setCommissionRate] = useState<string>('');
    const [commissionInput, setCommissionInput] = useState<string>('');
    const [savingCommission, setSavingCommission] = useState(false);

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
            let blockedEmails: string[] = [];
            // Load blocked emails
            const blockedResponse = await fetch(`${getApiBaseUrl()}/api/admin/blocked-emails`, { headers });
            if (blockedResponse.ok) {
                const blockedData = await blockedResponse.json();
                blockedEmails = blockedData.emails || [];
            }
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                // Mark blocked users
                const usersWithBlocked = (usersData.users || []).map((u: any) => ({ ...u, blocked: blockedEmails.includes(u.email) }));
                setUsers(usersWithBlocked);
            }

            // Load platform settings
            const settingsResponse = await fetch(`${getApiBaseUrl()}/api/admin/settings`, { headers });
            if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                const rate = settingsData.commission_rate || '0.05';
                setCommissionRate(rate);
                setCommissionInput((parseFloat(rate) * 100).toFixed(2));
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

    const handleSaveCommissionRate = async () => {
        const pct = parseFloat(commissionInput);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            Alert.alert('Error', 'Ingresa un porcentaje válido entre 0 y 100.');
            return;
        }
        setSavingCommission(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ commission_rate: pct / 100 }),
            });
            if (response.ok) {
                const data = await response.json();
                setCommissionRate(data.commission_rate.toString());
                Alert.alert('✅ Guardado', `Comisión actualizada a ${pct.toFixed(2)}%`);
            } else {
                const err = await response.json();
                Alert.alert('Error', err.error || 'No se pudo guardar');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Error de red');
        } finally {
            setSavingCommission(false);
        }
    };

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
            {/* Filter UI */}
            <View style={styles.filterBar}>
                <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterButton, filter === 'all' && styles.filterActive]}><Text style={styles.filterText}>Todos</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('active')} style={[styles.filterButton, filter === 'active' && styles.filterActive]}><Text style={styles.filterText}>Activos</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilter('blocked')} style={[styles.filterButton, filter === 'blocked' && styles.filterActive]}><Text style={styles.filterText}>Bloqueados</Text></TouchableOpacity>
            </View>
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

                    {/* Platform Settings — Commission Rate */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⚙️ Configuración de Plataforma</Text>
                        <Text style={styles.settingLabel}>
                            Comisión de plataforma (%)
                        </Text>
                        <Text style={styles.settingHint}>
                            Valor actual: {(parseFloat(commissionRate || '0.05') * 100).toFixed(2)}% — se aplica a todos los pagos de Stripe y MercadoPago.
                        </Text>
                        <View style={styles.settingRow}>
                            <TextInput
                                style={styles.settingInput}
                                value={commissionInput}
                                onChangeText={setCommissionInput}
                                keyboardType="decimal-pad"
                                placeholder="5.00"
                                maxLength={5}
                            />
                            <Text style={styles.settingPercent}>%</Text>
                            <TouchableOpacity
                                style={[styles.saveSettingButton, savingCommission && { opacity: 0.6 }]}
                                onPress={handleSaveCommissionRate}
                                disabled={savingCommission}
                            >
                                <Text style={styles.saveSettingText}>
                                    {savingCommission ? 'Guardando...' : 'Guardar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Users */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Usuarios Recientes</Text>
                        {users.filter(user => {
                            if (filter === 'all') return true;
                            if (filter === 'active') return !user.blocked;
                            if (filter === 'blocked') return user.blocked;
                            return true;
                        }).map((user) => (
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
                                    {user.blocked ? (
                                        <TouchableOpacity
                                            style={styles.unblockButton}
                                            onPress={async () => {
                                                if (!confirm('¿Seguro que quieres desbloquear este usuario?')) return;
                                                try {
                                                    setLoading(true);
                                                    setError('');
                                                    const token = await AsyncStorage.getItem('authToken');
                                                    const headers = {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    };
                                                    const response = await fetch(`${getApiBaseUrl()}/api/admin/unblock-user`, {
                                                        method: 'POST',
                                                        headers,
                                                        body: JSON.stringify({ email: user.email })
                                                    });
                                                    if (response.ok) {
                                                        setUsers(users.map(u => u.email === user.email ? { ...u, blocked: false } : u));
                                                    } else {
                                                        const errorData = await response.json();
                                                        setError(errorData.error || 'Error al desbloquear usuario');
                                                    }
                                                } catch (err: any) {
                                                    setError(err.message || 'Error al desbloquear usuario');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            <Text style={styles.unblockButtonText}>Desbloquear</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={async () => {
                                                if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;
                                                try {
                                                    setLoading(true);
                                                    setError('');
                                                    const token = await AsyncStorage.getItem('authToken');
                                                    const headers = {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    };
                                                    const response = await fetch(`${getApiBaseUrl()}/api/admin/remove-user`, {
                                                        method: 'POST',
                                                        headers,
                                                        body: JSON.stringify({ email: user.email })
                                                    });
                                                    if (response.ok) {
                                                        setUsers(users.map(u => u.email === user.email ? { ...u, blocked: true } : u));
                                                    } else {
                                                        const errorData = await response.json();
                                                        setError(errorData.error || 'Error al eliminar usuario');
                                                    }
                                                } catch (err: any) {
                                                    setError(err.message || 'Error al eliminar usuario');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            <Text style={styles.removeButtonText}>Eliminar</Text>
                                        </TouchableOpacity>
                                    )}
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
    settingLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    settingHint: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingInput: {
        width: 80,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.background,
        textAlign: 'center',
    },
    settingPercent: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    saveSettingButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    saveSettingText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
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
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 10,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: Colors.surface,
        marginHorizontal: 4,
    },
    filterActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        color: Colors.text,
        fontWeight: '600',
    },
    unblockButton: {
        marginTop: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    unblockButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    removeButton: {
        marginTop: 8,
        backgroundColor: Colors.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    removeButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
});
