import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const IncidentsScreen = () => {
  const [incidentName, setIncidentName] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentImage, setIncidentImage] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const currentUserId = 'recolector123';

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitas dar permiso para acceder a la cámara para subir fotos de incidentes.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setIncidentImage(result.assets[0].uri);
    }
  };

  const handleSaveIncident = () => {
    if (!incidentName || !incidentDescription) {
      Alert.alert('Campos Obligatorios', 'Por favor, completa el nombre y la descripción del incidente.');
      return;
    }

    const newIncident = {
      id: String(incidents.length + 1),
      userId: currentUserId,
      name: incidentName,
      description: incidentDescription,
      date: incidentDate,
      imageUri: incidentImage,
    };

    setIncidents([...incidents, newIncident]);

    setIncidentName('');
    setIncidentDescription('');
    setIncidentImage(null);
    setShowForm(false);
    Alert.alert('Incidente Registrado', 'El incidente ha sido guardado exitosamente.');
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setModalVisible(true);
  };

  const userIncidents = incidents.filter(incident => incident.userId === currentUserId);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Gestión de Incidentes</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, !showForm && styles.activeButton]} 
          onPress={() => setShowForm(false)}
        >
          <MaterialIcons name="list" size={20} color={!showForm ? '#fff' : '#00796B'} />
          <Text style={[styles.actionButtonText, !showForm && styles.activeButtonText]}>Ver Incidentes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, showForm && styles.activeButton]} 
          onPress={() => setShowForm(true)}
        >
          <MaterialIcons name="add-circle-outline" size={20} color={showForm ? '#fff' : '#00796B'} />
          <Text style={[styles.actionButtonText, showForm && styles.activeButtonText]}>Nuevo Incidente</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.formLabel}>Nombre del Incidente:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Contenedor dañado"
            value={incidentName}
            onChangeText={setIncidentName}
          />

          <Text style={styles.formLabel}>Descripción:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalles sobre la anormalidad encontrada..."
            multiline
            numberOfLines={4}
            value={incidentDescription}
            onChangeText={setIncidentDescription}
          />

          <Text style={styles.formLabel}>Fecha:</Text>
          <TextInput
            style={styles.input}
            value={new Date(incidentDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            editable={false}
          />

          <TouchableOpacity style={styles.imagePickerButton} onPress={takePhoto}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.imagePickerButtonText}>Tomar Foto</Text>
          </TouchableOpacity>

          {incidentImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: incidentImage }} style={styles.imagePreview} />
              <Text style={styles.imageName}>Foto del Incidente</Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveIncident}>
            <MaterialIcons name="save" size={24} color="#fff" />
            <Text style={styles.saveButtonText}>Guardar Incidente</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContentContainer}>
          {userIncidents.length === 0 ? (
            <View style={styles.noIncidents}>
              <MaterialIcons name="error-outline" size={60} color="#B0BEC5" />
              <Text style={styles.noIncidentsText}>Aún no has reportado ningún incidente.</Text>
              <Text style={styles.noIncidentsText}>¡Comienza reportando uno nuevo!</Text>
            </View>
          ) : (
            userIncidents.map((incident) => (
              <TouchableOpacity
                key={incident.id}
                style={styles.incidentCard}
                onPress={() => handleViewIncident(incident)}
              >
                <View style={styles.incidentCardHeader}>
                  <Text style={styles.incidentCardTitle}>{incident.name}</Text>
                  <Text style={styles.incidentCardDate}>{new Date(incident.date).toLocaleDateString('es-ES')}</Text>
                </View>
                <Text style={styles.incidentCardDescription} numberOfLines={2}>{incident.description}</Text>
                {incident.imageUri && (
                  <MaterialIcons name="image" size={20} color="#0097A7" style={styles.incidentCardImageIndicator} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

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
              <Text style={styles.modalTitle}>{selectedIncident?.name}</Text>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="date-range" size={20} color="#0097A7" />
                <Text style={styles.detailText}>Fecha: {new Date(selectedIncident?.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              
              <Text style={styles.sectionHeader}>Descripción del Incidente</Text>
              <Text style={styles.modalDescription}>{selectedIncident?.description}</Text>

              {selectedIncident?.imageUri && (
                <>
                  <Text style={styles.sectionHeader}>Evidencia Fotográfica</Text>
                  <Image source={{ uri: selectedIncident.imageUri }} style={styles.modalImage} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#E0F2F7',
    borderRadius: 10,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 10,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#00796B',
  },
  activeButton: {
    backgroundColor: '#0097A7',
  },
  activeButtonText: {
    color: '#fff',
  },
  formContainer: {
    paddingBottom: 80,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  imageName: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#00796B',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContentContainer: {
    paddingBottom: 80,
  },
  noIncidents: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    opacity: 0.8,
  },
  noIncidentsText: {
    fontSize: 16,
    color: '#78909C',
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  incidentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#FBC02D',
    position: 'relative',
  },
  incidentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
    marginRight: 10,
  },
  incidentCardDate: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  incidentCardDescription: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 5,
  },
  incidentCardImageIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#37474F',
    marginLeft: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#78909C',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    paddingBottom: 5,
  },
  modalDescription: {
    fontSize: 16,
    color: '#546E7A',
    lineHeight: 24,
    marginBottom: 15,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    resizeMode: 'contain',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
  },
  modalScrollContent: {
    paddingBottom: 50,
  }
});

export default IncidentsScreen;
