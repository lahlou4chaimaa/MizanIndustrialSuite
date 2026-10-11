// src/components/WeightDisplay.jsx

import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function WeightDisplay({
    weight = 0,
    label = 'POIDS',
    unit = 'kg',
    connected = false,
}) {
    const numericWeight = Number(weight);

    const validWeight =
        Number.isFinite(numericWeight) &&
        numericWeight >= 0;

    const displayWeight = validWeight
        ? numericWeight
        : 0;

    const formattedWeight =
        displayWeight.toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <Text style={styles.label}>
                    {label}
                </Text>

                <View
                    style={[
                        styles.status,
                        connected
                            ? styles.statusConnected
                            : styles.statusDisconnected,
                    ]}
                >
                    <View
                        style={[
                            styles.dot,
                            connected
                                ? styles.dotConnected
                                : styles.dotDisconnected,
                        ]}
                    />

                    <Text
                        style={
                            styles.statusText
                        }
                    >
                        {connected
                            ? 'BALANCE CONNECTÉE'
                            : 'BALANCE EN ATTENTE'}
                    </Text>
                </View>
            </View>

            <View style={styles.weightBox}>
                <Text style={styles.weight}>
                    {formattedWeight}
                </Text>

                <Text style={styles.unit}>
                    {unit}
                </Text>
            </View>

            <View style={styles.bottomRow}>
                <View>
                    <Text
                        style={
                            styles.secondaryLabel
                        }
                    >
                        ÉTAT
                    </Text>

                    <Text
                        style={
                            styles.secondaryValue
                        }
                    >
                        {connected
                            ? 'Lecture active'
                            : 'Aucune lecture'}
                    </Text>
                </View>

                <View style={styles.liveBadge}>
                    <Text
                        style={
                            styles.liveText
                        }
                    >
                        {connected
                            ? 'LIVE'
                            : '—'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 4,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    label: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6b7280',
        letterSpacing: 0.5,
    },

    status: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },

    statusConnected: {
        backgroundColor: '#dcfce7',
    },

    statusDisconnected: {
        backgroundColor: '#f3f4f6',
    },

    dot: {
        width: 7,
        height: 7,
        borderRadius: 7,
        marginRight: 6,
    },

    dotConnected: {
        backgroundColor: '#16a34a',
    },

    dotDisconnected: {
        backgroundColor: '#9ca3af',
    },

    statusText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#374151',
    },

    weightBox: {
        minHeight: 105,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
    },

    weight: {
        fontSize: 42,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -1,
    },

    unit: {
        marginLeft: 9,
        marginTop: 13,
        fontSize: 16,
        fontWeight: '800',
        color: '#6b7280',
    },

    bottomRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    secondaryLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#9ca3af',
        letterSpacing: 0.4,
    },

    secondaryValue: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
    },

    liveBadge: {
        minWidth: 42,
        height: 25,
        borderRadius: 7,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    liveText: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: '900',
    },
});