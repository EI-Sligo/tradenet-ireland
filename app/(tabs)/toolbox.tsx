// app/(tabs)/toolbox.tsx
import { Calculator, Gauge, Zap } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { COLORS } from '../../src/constants/theme';

export default function ToolboxScreen() {
  const [activeTab, setActiveTab] = useState<'ma' | 'voltage'>('ma');

  // 4-20mA State
  const [maValue, setMaValue] = useState('');
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  const [scaledResult, setScaledResult] = useState<string | null>(null);

  // Voltage Drop State (U)
  const [currentI, setCurrentI] = useState('');
  const [lengthL, setLengthL] = useState('');
  const [areaA, setAreaA] = useState('');
  const [material, setMaterial] = useState<'Cu' | 'Al'>('Cu');
  const [uDropResult, setUDropResult] = useState<string | null>(null);

  const calculateMA = () => {
    const ma = parseFloat(maValue);
    const min = parseFloat(minVal);
    const max = parseFloat(maxVal);

    if (isNaN(ma) || isNaN(min) || isNaN(max)) {
      setScaledResult('Enter all fields');
      return;
    }
    if (ma < 4 || ma > 20) {
      setScaledResult('mA must be between 4 and 20');
      return;
    }

    const span = max - min;
    const percentage = (ma - 4) / 16;
    const result = min + percentage * span;
    setScaledResult(result.toFixed(2));
  };

  const calculateUDrop = () => {
    const I = parseFloat(currentI);
    const L = parseFloat(lengthL);
    const A = parseFloat(areaA);

    if (isNaN(I) || isNaN(L) || isNaN(A) || A <= 0) {
      setUDropResult('Enter valid positive numbers');
      return;
    }

    // Resistivity (ρ) values at standard operating temp (Ω·mm²/m)
    const rho = material === 'Cu' ? 0.0173 : 0.0283;
    
    // Single Phase Voltage Drop formula: ΔU = (2 * ρ * L * I) / A
    const Ud = (2 * rho * L * I) / A;
    setUDropResult(`${Ud.toFixed(2)} U`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pocket Toolbox</Text>
        <Text style={styles.headerSubtitle}>Offline Trade Calculators</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ma' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ma')}
        >
          <Gauge color={activeTab === 'ma' ? COLORS.textPrimary : COLORS.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'ma' && styles.tabTextActive]}>4-20mA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'voltage' && styles.tabBtnActive]}
          onPress={() => setActiveTab('voltage')}
        >
          <Zap color={activeTab === 'voltage' ? COLORS.textPrimary : COLORS.textSecondary} size={18} />
          <Text style={[styles.tabText, activeTab === 'voltage' && styles.tabTextActive]}>ΔU Drop</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'ma' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sensor Scaling (4-20mA)</Text>
            
            <Text style={styles.label}>Measured Current (mA)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g., 12" placeholderTextColor={COLORS.textSecondary} value={maValue} onChangeText={setMaValue} />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Min Range (4mA)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textSecondary} value={minVal} onChangeText={setMinVal} />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Max Range (20mA)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="100" placeholderTextColor={COLORS.textSecondary} value={maxVal} onChangeText={setMaxVal} />
              </View>
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={calculateMA}>
              <Calculator color="#0F172A" size={20} />
              <Text style={styles.calcBtnText}>Calculate</Text>
            </TouchableOpacity>

            {scaledResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Scaled Process Variable</Text>
                <Text style={styles.resultValue}>{scaledResult}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>I.S. 10101 Voltage Drop (ΔU)</Text>

            <Text style={styles.label}>Conductor Material</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.pill, material === 'Cu' && styles.pillActive]} onPress={() => setMaterial('Cu')}>
                <Text style={[styles.pillText, material === 'Cu' && styles.pillTextActive]}>Copper (Cu)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pill, material === 'Al' && styles.pillActive]} onPress={() => setMaterial('Al')}>
                <Text style={[styles.pillText, material === 'Al' && styles.pillTextActive]}>Aluminium (Al)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Design Current (I) in Amps</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g., 32" placeholderTextColor={COLORS.textSecondary} value={currentI} onChangeText={setCurrentI} />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Length (L) in Meters</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g., 25" placeholderTextColor={COLORS.textSecondary} value={lengthL} onChangeText={setLengthL} />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Area (A) in mm²</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g., 6" placeholderTextColor={COLORS.textSecondary} value={areaA} onChangeText={setAreaA} />
              </View>
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={calculateUDrop}>
              <Calculator color="#0F172A" size={20} />
              <Text style={styles.calcBtnText}>Calculate ΔU</Text>
            </TouchableOpacity>

            {uDropResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Total Voltage Drop (ΔU)</Text>
                <Text style={styles.resultValue}>{uDropResult}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  tabBtnActive: { backgroundColor: '#292524', borderColor: COLORS.safetyAmber },
  tabText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: COLORS.safetyAmber },
  content: { padding: 20, paddingBottom: 80 },
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  halfCol: { flex: 1 },
  pill: { flex: 1, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  pillActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  pillText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: COLORS.textPrimary },
  calcBtn: { backgroundColor: COLORS.safetyAmber, borderRadius: 10, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 },
  calcBtnText: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  resultBox: { backgroundColor: '#292524', borderWidth: 1, borderColor: COLORS.safetyAmber, borderRadius: 10, padding: 16, marginTop: 20, alignItems: 'center' },
  resultLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  resultValue: { color: COLORS.safetyAmber, fontSize: 28, fontWeight: '800' },
});