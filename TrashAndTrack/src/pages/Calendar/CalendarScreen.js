import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';

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

  const collectionData = {
    '2025-07-08': [
      {
        id: '1',
        title: 'Recolección Zona Industrial',
        time: '08:00 - 10:00',
        location: 'Parque Industrial Norte, Nave 12',
        status: 'completado',
        details: { peso: '1,250 kg', tipoResiduo: 'Químicos industriales', vehiculo: 'Camión-0452', notas: 'Usar equipo de protección nivel 3' }
      }
    ],
    '2025-07-15': [
      {
        id: '3',
        title: 'Recolección Hospital Regional',
        time: '09:30 - 11:00',
        location: 'Hospital Regional, Área de Residuos',
        status: 'asignado',
        details: { peso: '850 kg estimados', tipoResiduo: 'Biológico-infecciosos', vehiculo: 'Camión-0781', notas: 'Requiere documentación de trazabilidad' }
      }
    ],
    '2025-07-22': [
      {
        id: '4',
        title: 'Recolección Planta Recicladora',
        time: '10:00 - 11:00',
        location: 'Planta de Reciclaje EcoSafe',
        status: 'asignado',
        details: { peso: '2,100 kg estimados', tipoResiduo: 'Metales pesados', vehiculo: 'Por asignar', notas: 'Necesario equipo especial para metales' }
      },
      {
        id: '5',
        title: 'Recolección Taller Automotriz',
        time: '11:30 - 12:30',
        location: 'Autoservicio "El Veloz"',
        status: 'asignado',
        details: { peso: '400 kg estimados', tipoResiduo: 'Aceites y solventes', vehiculo: 'Por asignar', notas: 'Verificar contenedores de aceite' }
      },
      {
        id: '6',
        title: 'Recolección Constructora Central',
        time: '14:00 - 15:00',
        location: 'Obra en Calle Revolución #123',
        status: 'asignado',
        details: { peso: '3,500 kg estimados', tipoResiduo: 'Escombros y amianto', vehiculo: 'Por asignar', notas: 'Precaución con material frágil' }
      },
      {
        id: '7',
        title: 'Recolección Farmacéutica',
        time: '16:00 - 17:00',
        location: 'Laboratorios VidaSana',
        status: 'asignado',
        details: { peso: '150 kg estimados', tipoResiduo: 'Medicamentos caducados', vehiculo: 'Por asignar', notas: 'Transporte controlado' }
      },
      {
        id: '8',
        title: 'Recolección de Pinturas',
        time: '17:30 - 18:30',
        location: 'Tienda de Pinturas ColorVida',
        status: 'asignado',
        details: { peso: '200 kg estimados', tipoResiduo: 'Pinturas y solventes', vehiculo: 'Por asignar', notas: 'Material inflamable' }
      },
      {
        id: '9',
        title: 'Recolección de Electrónica',
        time: '19:00 - 20:00',
        location: 'Centro de Electrónica TechRecycle',
        status: 'asignado',
        details: { peso: '700 kg estimados', tipoResiduo: 'Residuos electrónicos', vehiculo: 'Por asignar', notas: 'Desmontaje necesario' }
      }
    ]
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

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleCollectionPress = (collection) => {
    setSelectedCollection(collection);
    setModalVisible(true);
  };

  const renderCollections = () => {
    const collectionsForDay = collectionData[selectedDate];
    if (!collectionsForDay || collectionsForDay.length === 0) {
      return (
        <View style={styles.noCollections}>
          <MaterialIcons name="event-available" size={60} color="#B0BEC5" />
          <Text style={styles.noCollectionsText}>¡Día libre! No hay recolecciones.</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.listContainer} 
        contentContainerStyle={styles.listContentContainer}
      >
        {collectionsForDay.map((collection) => (
          <TouchableOpacity
            key={collection.id}
            style={[styles.collectionCard, 
              collection.status === 'completado' ? styles.completedCard : styles.assignedCard
            ]}
            onPress={() => handleCollectionPress(collection)}
          >
            <View style={styles.collectionHeader}>
              <Text style={styles.collectionTime}>{collection.time}</Text>
              <View style={[styles.statusBadge, 
                collection.status === 'completado' ? styles.completedBadge : styles.assignedBadge
              ]}>
                <Text style={[styles.statusText,
                  collection.status === 'completado' ? {color: '#388E3C'} : {color: '#1976D2'}
                ]}>{collection.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={16} color="#757575" />
              <Text style={styles.collectionLocation}>{collection.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={28} color="#9E9E9E" />
            </TouchableOpacity>
            
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>{selectedCollection?.title}</Text>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color="#0097A7" />
                <Text style={styles.detailText}>{selectedCollection?.time}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color="#0097A7" />
                <Text style={styles.detailText}>{selectedCollection?.location}</Text>
              </View>
              
              <Text style={styles.sectionHeader}>Detalles de la Carga</Text>
              
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Peso:</Text><Text style={styles.detailValue}>{selectedCollection?.details.peso}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Tipo de residuo:</Text><Text style={styles.detailValue}>{selectedCollection?.details.tipoResiduo}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Vehículo:</Text><Text style={styles.detailValue}>{selectedCollection?.details.vehiculo}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Notas:</Text><Text style={styles.detailValue}>{selectedCollection?.details.notas}</Text></View>
              
              {selectedCollection?.status === 'asignado' && (
                <TouchableOpacity style={styles.startButton}>
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
