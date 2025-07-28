import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, RefreshControl 
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [collectionData, setCollectionData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const userId = 2; // ← CAMBIA este ID por el real del usuario logueado

  const fetchItinerarios = async () => {
    try {
      const res = await axios.get(`http://${IP_URL}:5000/api/itinerarios/usuario/${userId}`);
      const data = res.data.data;

      const grouped = {};

      data.forEach(it => {
        if (it.estado.toLowerCase() === 'cancelado') return;

        const fecha = it.fechaProgramada;
        if (!grouped[fecha]) grouped[fecha] = [];

        grouped[fecha].push({
          id: it.id,
          title: it.nombreRuta,
          time: 'Sin hora',
          location: it.descripcionRuta,
          status: it.estado.toLowerCase(),
          details: {
            peso: calcularPeso(it.empresas),
            tipoResiduo: extraerTiposResiduo(it.empresas),
            notas: `Incluye ${contarEmpresas(it.empresas)} empresa(s)`
          }
        });
      });

      setCollectionData(grouped);
    } catch (error) {
      console.error("Error al obtener itinerarios:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItinerarios().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchItinerarios();
  }, []);

  const calcularPeso = (empresasJSON) => {
    try {
      const empresas = JSON.parse(empresasJSON);
      const total = empresas.reduce((sum, e) => sum + (e.peso_estimado || 0), 0);
      return `${total} kg estimados`;
    } catch {
      return "Peso no disponible";
    }
  };

  const extraerTiposResiduo = (empresasJSON) => {
    try {
      const empresas = JSON.parse(empresasJSON);
      const tipos = new Set();
      empresas.forEach(emp =>
        emp.tipos_residuos.forEach(r => tipos.add(r.nombre_tipo_residuo))
      );
      return Array.from(tipos).join(', ');
    } catch {
      return "Tipo no disponible";
    }
  };

  const contarEmpresas = (empresasJSON) => {
    try {
      return JSON.parse(empresasJSON).length;
    } catch {
      return 0;
    }
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleCollectionPress = (collection) => {
    setSelectedCollection(collection);
    setModalVisible(true);
  };

  const iniciarRuta = async (idItinerario) => {
    try {
      await axios.put(`http://${IP_URL}:5000/api/itinerarios/${idItinerario}/estado`, '"INICIADO"', {
        headers: { 'Content-Type': 'application/json' }
      });

      Alert.alert("Ruta iniciada", "Redirigiendo a tu ruta asignada...");
      setModalVisible(false);
      fetchItinerarios();

      navigation.navigate('Ruta');
    } catch (err) {
      console.error("Error al iniciar ruta:", err);
      Alert.alert("Error", "No se pudo actualizar el estado.");
    }
  };

  const markedDates = {};
  Object.keys(collectionData).forEach(date => {
    const statuses = collectionData[date].map(c => c.status);
    let dotColor = '#64B5F6';
    if (statuses.every(s => s === 'completado')) dotColor = '#81C784';

    markedDates[date] = { marked: true, dotColor, selected: date === selectedDate };
  });

  if (markedDates[selectedDate]) {
    markedDates[selectedDate].selectedColor = '#4DD0E1';
  } else {
    markedDates[selectedDate] = { selected: true, selectedColor: '#4DD0E1' };
  }

  const renderCollections = () => {
    const collections = collectionData[selectedDate];

    if (!collections || collections.length === 0) {
      return (
        <View style={styles.noCollections}>
          <MaterialIcons name="event-available" size={60} color="#B0BEC5" />
          <Text style={styles.noCollectionsText}>¡Día libre! No hay recolecciones.</Text>
        </View>
      );
    }

    return (
      <>
        {collections.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            style={[
              styles.collectionCard,
              collection.status === 'completado' ? styles.completedCard : styles.assignedCard
            ]}
            onPress={() => handleCollectionPress(collection)}
          >
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionTime}>{collection.time}</Text>
              <View style={[
                styles.statusBadge,
                collection.status === 'completado' ? styles.completedBadge : styles.assignedBadge
              ]}>
                <Text style={[
                  styles.statusText,
                  collection.status === 'completado' ? { color: '#388E3C' } : { color: '#1976D2' }
                ]}>
                  {collection.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={16} color="#757575" />
              <Text style={styles.collectionLocation}>{collection.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
  <View style={styles.container}>
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.headerTitle}>Mis Recolecciones</Text>
      <Calendar
        style={styles.calendar}
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#F7F9FC',
          calendarBackground: '#F7F9FC',
          textSectionTitleColor: '#5D6D7E',
          selectedDayBackgroundColor: '#4DD0E1',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#E57373',
          dayTextColor: '#2C3E50',
          textDisabledColor: '#BDC3C7',
          arrowColor: '#0097A7',
          monthTextColor: '#00796B',
          textMonthFontWeight: 'bold',
          textDayFontFamily: 'sans-serif-light',
          textMonthFontFamily: 'sans-serif-medium',
          textDayHeaderFontFamily: 'sans-serif-medium',
          textMonthFontSize: 18,
        }}
      />

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#64B5F6' }]} /><Text style={styles.legendText}>Asignado</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#81C784' }]} /><Text style={styles.legendText}>Completado</Text></View>
      </View>

      <Text style={styles.sectionTitle}>
        Tareas para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      {renderCollections()}
    </ScrollView>

    <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <MaterialIcons name="close" size={28} color="#9E9E9E" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalTitle}>{selectedCollection?.title}</Text>

            <View style={styles.detailRow}><MaterialIcons name="access-time" size={20} color="#0097A7" /><Text style={styles.detailText}>{selectedCollection?.time}</Text></View>
            <View style={styles.detailRow}><MaterialIcons name="location-on" size={20} color="#0097A7" /><Text style={styles.detailText}>{selectedCollection?.location}</Text></View>

            <Text style={styles.sectionHeader}>Detalles de la Carga</Text>
            <View style={styles.detailItem}><Text style={styles.detailLabel}>Peso:</Text><Text style={styles.detailValue}>{selectedCollection?.details.peso}</Text></View>
            <View style={styles.detailItem}><Text style={styles.detailLabel}>Tipo de residuo:</Text><Text style={styles.detailValue}>{selectedCollection?.details.tipoResiduo}</Text></View>
            <View style={styles.detailItem}><Text style={styles.detailLabel}>Notas:</Text><Text style={styles.detailValue}>{selectedCollection?.details.notas}</Text></View>

            {selectedCollection?.status === 'pendiente' && (
              <TouchableOpacity style={styles.startButton} onPress={() => iniciarRuta(selectedCollection.id)}>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={styles.startButtonText}>INICIAR RUTA</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>
);
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC', paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginVertical: 20, textAlign: 'center' },
  calendar: { borderRadius: 15, elevation: 3, shadowColor: '#B0BEC5', shadowOpacity: 0.3, shadowRadius: 5 },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 20, elevation: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#5D6D7E' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#00796B', marginTop: 15, marginBottom: 10 },
  listContainer: { flex: 1 },
  listContentContainer: { paddingBottom: 80 },
  noCollections: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, opacity: 0.8 },
  noCollectionsText: { fontSize: 16, color: '#78909C', fontWeight: '500', marginTop: 10 },
  collectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#ECEFF1' },
  completedCard: { borderLeftColor: '#81C784', borderLeftWidth: 6 },
  assignedCard: { borderLeftColor: '#64B5F6', borderLeftWidth: 6 },
  collectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  collectionTime: { fontSize: 14, color: '#37474F', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completedBadge: { backgroundColor: '#E8F5E9' },
  assignedBadge: { backgroundColor: '#E3F2FD' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  collectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  collectionLocation: { fontSize: 14, color: '#757575', marginLeft: 5, flexShrink: 1 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '85%' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20, textAlign: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailText: { fontSize: 16, color: '#37474F', marginLeft: 12 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#78909C', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#CFD8DC', paddingBottom: 5 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ECEFF1' },
  detailLabel: { fontSize: 15, color: '#546E7A' },
  detailValue: { fontSize: 15, color: '#263238', fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: 10 },
  startButton: { backgroundColor: '#26A69A', borderRadius: 15, padding: 15, alignItems: 'center', justifyContent: 'center', marginTop: 25, flexDirection: 'row', elevation: 2 },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  modalScrollContent: { paddingBottom: 40 }
});

export default CalendarScreen;
