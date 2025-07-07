import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// Importa Firebase si vas a guardar los reportes. Por ahora, usaremos datos locales.
// import { db } from '../../config/Firebase/firebaseConfig';
// import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState('create');
  const [reportData, setReportData] = useState({
    reportName: '',
    description: '',
    containerId: '',
    collectedAmount: '',
    containerStatus: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReports, setCreatedReports] = useState([
    { id: 'RPT-001', reportName: 'Recolección Diaria Ruta A', description: 'Todo en orden en la ruta asignada.', containerId: 'CONT-101', collectedAmount: '500 kg', containerStatus: 'Vacio', date: '01/07/2025' },
    { id: 'RPT-002', reportName: 'Recolección Contenedor Especial', description: 'Contenedor con poca cantidad, pero se procesó.', containerId: 'CONT-105', collectedAmount: '320 kg', containerStatus: 'Parcialmente Lleno', date: '02/07/2025' },
    { id: 'RPT-003', reportName: 'Recolección con Incidencia', description: 'Contenedor dañado, necesita reemplazo urgente.', containerId: 'CONT-110', collectedAmount: '800 kg', containerStatus: 'Dañado', date: '03/07/2025' },
    // Añadimos algunos más para asegurar que el scroll funcione
    { id: 'RPT-004', reportName: 'Recolección Extra', description: 'Contenedor adicional en ruta.', containerId: 'CONT-115', collectedAmount: '150 kg', containerStatus: 'Vacio', date: '03/07/2025' },
    { id: 'RPT-005', reportName: 'Recolección Nocturna', description: 'Todo bien en recolección de madrugada.', containerId: 'CONT-120', collectedAmount: '600 kg', containerStatus: 'Vacio', date: '04/07/2025' },
  ]);

  // Si decides integrar Firebase para guardar y cargar, podrías usar un useEffect aquí:
  /*
  useEffect(() => {
    const q = query(collection(db, "collectionReports"), orderBy("fecha_reporte", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = [];
      snapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });
      setCreatedReports(reports);
    }, (error) => {
      console.error("Error fetching reports: ", error);
      Alert.alert("Error", "No se pudieron cargar los reportes.");
    });
    return () => unsubscribe();
  }, []);
  */

  const handleInputChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
  };

  const handleSubmitReport = async () => {
    if (!reportData.reportName || !reportData.containerId || !reportData.collectedAmount || !reportData.containerStatus) {
      Alert.alert('Campos Incompletos', 'Por favor, llena todos los campos obligatorios: Nombre del Reporte, ID del Contenedor, Cantidad Recolectada y Estado del Contenedor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newReport = {
        id: `RPT-${Math.floor(Math.random() * 10000)}`,
        reportName: reportData.reportName,
        description: reportData.description,
        containerId: reportData.containerId,
        collectedAmount: reportData.collectedAmount,
        containerStatus: reportData.containerStatus,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      /*
      const docRef = await addDoc(collection(db, "collectionReports"), {
        id_reporte: newReport.id,
        nombre: newReport.reportName,
        descripcion: newReport.description,
        containerId: newReport.containerId,
        collectedAmount: newReport.collectedAmount,
        containerStatus: newReport.containerStatus,
        fecha_reporte: serverTimestamp(),
      });
      newReport.id = docRef.id;
      */

      setCreatedReports(prevReports => [newReport, ...prevReports]);
      setReportData({
        reportName: '',
        description: '',
        containerId: '',
        collectedAmount: '',
        containerStatus: '',
      });
      Alert.alert('Reporte Enviado', 'El reporte de recolección ha sido enviado exitosamente.');
      setActiveTab('view');
    } catch (error) {
      console.error("Error al enviar el reporte: ", error);
      Alert.alert('Error', 'Hubo un problema al enviar el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCreateReportTab = () => (
    <ScrollView contentContainerStyle={styles.tabContentScroll}> 
      <Text style={styles.formLabel}>Nombre del Reporte:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reporte de Recolección Ruta Norte"
        value={reportData.reportName}
        onChangeText={(text) => handleInputChange('reportName', text)}
      />

      <Text style={styles.formLabel}>ID del Contenedor:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: CONT-XYZ"
        value={reportData.containerId}
        onChangeText={(text) => handleInputChange('containerId', text)}
      />

      <Text style={styles.formLabel}>Cantidad Recolectada (kg/L):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 500"
        keyboardType="numeric"
        value={reportData.collectedAmount}
        onChangeText={(text) => handleInputChange('collectedAmount', text)}
      />

      <Text style={styles.formLabel}>Estado del Contenedor (después de recolectar):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Vacío, Parcialmente Lleno, Dañado"
        value={reportData.containerStatus}
        onChangeText={(text) => handleInputChange('containerStatus', text)}
      />

      <Text style={styles.formLabel}>Descripción / Observaciones:</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Detalles adicionales sobre la recolección o el contenedor..."
        multiline
        numberOfLines={4}
        value={reportData.description}
        onChangeText={(text) => handleInputChange('description', text)}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitReport}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>ENVIAR REPORTE</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <MaterialIcons name="description" size={24} color="#00796B" />
        <Text style={styles.reportTitle}>{item.reportName}</Text>
        <Text style={styles.reportDate}>{item.date}</Text>
      </View>
      <Text style={styles.reportDetail}>ID Reporte: <Text style={styles.reportDetailValue}>{item.id}</Text></Text>
      <Text style={styles.reportDetail}>ID Contenedor: <Text style={styles.reportDetailValue}>{item.containerId}</Text></Text>
      <Text style={styles.reportDetail}>Cantidad Recolectada: <Text style={styles.reportDetailValue}>{item.collectedAmount}</Text></Text>
      <Text style={styles.reportDetail}>Estado Contenedor: <Text style={styles.reportDetailValue}>{item.containerStatus}</Text></Text>
      {item.description ? (
        <Text style={styles.reportDetail}>Descripción: <Text style={styles.reportDetailValue}>{item.description}</Text></Text>
      ) : null}
    </View>
  );

  const renderViewReportsTab = () => (
    <View style={styles.tabContent}>
      {createdReports.length === 0 ? (
        <Text style={styles.noReportsText}>No hay reportes creados aún.</Text>
      ) : (
        <FlatList
          data={createdReports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.flatListContentContainer} 
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Reportes de Recolección</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.activeTabButton]}
          onPress={() => setActiveTab('create')}
        >
          <MaterialIcons name="add-task" size={20} color={activeTab === 'create' ? '#fff' : '#00796B'} />
          <Text style={[styles.tabButtonText, activeTab === 'create' && styles.activeTabButtonText]}>Nuevo Reporte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'view' && styles.activeTabButton]}
          onPress={() => setActiveTab('view')}
        >
          <MaterialIcons name="view-list" size={20} color={activeTab === 'view' ? '#fff' : '#00796B'} />
          <Text style={[styles.tabButtonText, activeTab === 'view' && styles.activeTabButtonText]}>Ver Reportes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? renderCreateReportTab() : renderViewReportsTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#E0F2F7',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#B2EBF2',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#00796B',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796B',
    marginLeft: 5,
  },
  activeTabButtonText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1, 
    backgroundColor: '#F7F9FC',
  },
  tabContentScroll: { 
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80, 
    backgroundColor: '#F7F9FC',
  },
  flatListContentContainer: { 
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 80, 
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495E',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00796B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#B0BEC5',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F7',
  },
  reportTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495E',
    marginLeft: 10,
  },
  reportDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  reportDetail: {
    fontSize: 15,
    color: '#5D6D7E',
    marginBottom: 4,
  },
  reportDetailValue: {
    fontWeight: '600',
    color: '#2C3E50',
  },
  noReportsText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 50,
  },
});