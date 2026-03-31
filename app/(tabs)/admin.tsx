import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { getApiBaseUrl } from '@/utils/api-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Users, DollarSign, TrendingUp, MessageSquare, Settings, Save, Edit3, Plus, Trash2 } from '@/components/SmartIcons';
import { Colors } from '@/constants/colors';

export default function AdminScreen() {
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked'>('all');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [config, setConfig] = useState<any[]>([]);
    const [profitDestinations, setProfitDestinations] = useState({
        stripe_id: '',
        cvu: '',
        alias: '',
        cbu: ''
    });
    // For generic config editing
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [newConfigKey, setNewConfigKey] = useState('');
    const [newConfigValue, setNewConfigValue] = useState('');
    const [showAddConfig, setShowAddConfig] = useState(false);

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

            // Load Config
            const configResponse = await fetch(`${getApiBaseUrl()}/api/admin/config`, { headers });
            if (configResponse.ok) {
                const configData = await configResponse.json();
                setConfig(configData);

                // Parse profit destinations
                setProfitDestinations({
                    stripe_id: configData.find((c: any) => c.key === 'profit_dest_stripe_id')?.value || '',
                    cvu: configData.find((c: any) => c.key === 'profit_dest_cvu')?.value || '',
                    alias: configData.find((c: any) => c.key === 'profit_dest_alias')?.value || '',
                    cbu: configData.find((c: any) => c.key === 'profit_dest_cbu')?.value || ''
                });
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

    const saveConfigValue = async (key: string, value: string, description?: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/config`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, value, description })
            });

            if (response.ok) {
                // Update local state
                const newConfig = [...config];
                const index = newConfig.findIndex(c => c.key === key);
                if (index >= 0) {
                    newConfig[index] = { ...newConfig[index], value, description: description || newConfig[index].description };
                } else {
                    newConfig.push({ key, value, description });
                }
                setConfig(newConfig);
                Alert.alert('Éxito', 'Configuración guardada correctamente');
                setEditingConfig(null);
                setShowAddConfig(false);
                setNewConfigKey('');
                setNewConfigValue('');
            } else {
                Alert.alert('Error', 'No se pudo guardar la configuración');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const saveProfitDestinations = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('authToken');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Save all 4 fields independently
            await Promise.all([
                fetch(`${getApiBaseUrl()}/api/admin/config`, { method: 'PUT', headers, body: JSON.stringify({ key: 'profit_dest_stripe_id', value: profitDestinations.stripe_id, description: 'Stripe Account ID for Profit Split' }) }),
                fetch(`${getApiBaseUrl()}/api/admin/config`, { method: 'PUT', headers, body: JSON.stringify({ key: 'profit_dest_cvu', value: profitDestinations.cvu, description: 'MercadoPago CVU for Profit Split' }) }),
                fetch(`${getApiBaseUrl()}/api/admin/config`, { method: 'PUT', headers, body: JSON.stringify({ key: 'profit_dest_alias', value: profitDestinations.alias, description: 'MercadoPago Alias for Profit Split' }) }),
                fetch(`${getApiBaseUrl()}/api/admin/config`, { method: 'PUT', headers, body: JSON.stringify({ key: 'profit_dest_cbu', value: profitDestinations.cbu, description: 'Bank CBU for Profit Split' }) })
            ]);

            Alert.alert('Éxito', 'Cuentas de destino actualizadas');
            // Reload to be sure
            loadAdminData();
        } catch (err) {
            Alert.alert('Error', 'Error al guardar destinos');
        } finally {
            setLoading(false);
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

                    {/* Configuration Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Settings size={20} color={Colors.text} />
                            <Text style={styles.sectionTitleWithIcon}>Configuración del Sistema</Text>
                        </View>

                        {/* Profit Destinations */}
                        <Text style={styles.subsectionTitle}>Destinos de Ganancias (Split Payment)</Text>
                        <View style={styles.configGroup}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Stripe Account ID</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profitDestinations.stripe_id}
                                    onChangeText={(text: string) => setProfitDestinations({ ...profitDestinations, stripe_id: text })}
                                    placeholder="acct_..."
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>MercadoPago CVU</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profitDestinations.cvu}
                                    onChangeText={(text: string) => setProfitDestinations({ ...profitDestinations, cvu: text })}
                                    placeholder="00000031000..."
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>MercadoPago Alias</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profitDestinations.alias}
                                    onChangeText={(text: string) => setProfitDestinations({ ...profitDestinations, alias: text })}
                                    placeholder="mi.alias.mp"
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>CBU Bancario</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profitDestinations.cbu}
                                    onChangeText={(text: string) => setProfitDestinations({ ...profitDestinations, cbu: text })}
                                    placeholder="01700..."
                                    keyboardType="numeric"
                                />
                            </View>
                            <TouchableOpacity style={styles.saveButton} onPress={saveProfitDestinations}>
                                <Save size={18} color="white" />
                                <Text style={styles.saveButtonText}>Guardar Destinos</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Generic Config */}
                        <View style={styles.subsectionHeaderRow}>
                            <Text style={styles.subsectionTitle}>Configuración Avanzada</Text>
                            <TouchableOpacity onPress={() => setShowAddConfig(!showAddConfig)} style={styles.iconButton}>
                                <Plus size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {showAddConfig && (
                            <View style={styles.addConfigForm}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Clave (Key)"
                                    value={newConfigKey}
                                    onChangeText={setNewConfigKey}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Valor"
                                    value={newConfigValue}
                                    onChangeText={setNewConfigValue}
                                />
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={() => saveConfigValue(newConfigKey, newConfigValue)}
                                >
                                    <Text style={styles.saveButtonText}>Añadir Configuración</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {config.filter(c => !c.key.startsWith('profit_dest_')).map((item) => (
                            <View key={item.key} style={styles.configItem}>
                                <View style={styles.configInfo}>
                                    <Text style={styles.configKey}>{item.key}</Text>
                                    {editingConfig === item.key ? (
                                        <TextInput
                                            style={styles.inputSmall}
                                            value={newConfigValue || item.value}
                                            onChangeText={setNewConfigValue}
                                            autoFocus
                                        />
                                    ) : (
                                        <Text style={styles.configValue}>{item.value}</Text>
                                    )}
                                    {item.description && <Text style={styles.configDesc}>{item.description}</Text>}
                                </View>
                                <View style={styles.configActions}>
                                    {editingConfig === item.key ? (
                                        <TouchableOpacity onPress={() => saveConfigValue(item.key, newConfigValue)}>
                                            <Save size={18} color={Colors.primary} />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={() => {
                                            setEditingConfig(item.key);
                                            setNewConfigValue(item.value);
                                        }}>
                                            <Edit3 size={18} color={Colors.textLight} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
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
                                            onPress={() => {
                                                Alert.alert(
                                                    'Confirmar',
                                                    '¿Seguro que quieres desbloquear este usuario?',
                                                    [
                                                        { text: 'Cancelar', style: 'cancel' },
                                                        {
                                                            text: 'Desbloquear',
                                                            onPress: async () => {
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
                                                            }
                                                        }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text style={styles.unblockButtonText}>Desbloquear</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => {
                                                Alert.alert(
                                                    'Confirmar',
                                                    '¿Seguro que quieres eliminar este usuario?',
                                                    [
                                                        { text: 'Cancelar', style: 'cancel' },
                                                        {
                                                            text: 'Eliminar',
                                                            style: 'destructive',
                                                            onPress: async () => {
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
                                                            }
                                                        }
                                                    ]
                                                );
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
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitleWithIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 10,
    },
    subsectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 10,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    configGroup: {
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 4,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: Colors.text,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    subsectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconButton: {
        padding: 4,
    },
    addConfigForm: {
        backgroundColor: Colors.background,
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        gap: 8,
    },
    configItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    configInfo: {
        flex: 1,
    },
    configKey: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    configValue: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 2,
    },
    configDesc: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
        fontStyle: 'italic',
    },
    inputSmall: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 4,
        padding: 4,
        fontSize: 14,
        color: Colors.text,
    },
    configActions: {
        marginLeft: 10,
    },
});
