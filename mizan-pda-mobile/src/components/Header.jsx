import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header({ agentName = "Agent Terrain", hangar = "Hangar 03" }) {
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>MIZAN — Terminal PDA</Text>
                <Text style={styles.subtitle}>{agentName} • {hangar}</Text>
            </View>
            <View style={styles.badgeOnline}>
                <Text style={styles.badgeText}>EN LIGNE</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    subtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
    badgeOnline: { backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
});