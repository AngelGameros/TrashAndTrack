"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Alert,
  RefreshControl,
  StatusBar,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const infoSections = [
  {
    id: "marcoLegal",
    title: "1. Marco Legal y Responsabilidades",
    icon: "gavel",
    content:
      "Como recolector de residuos peligrosos industriales, es clave conocer el marco legal que regula tus operaciones y responsabilidades.",
    subItems: [
      {
        id: "lgpgir",
        title: "Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR)",
        content:
          "La ley fundamental en México para residuos peligrosos. Establece las bases para prevenir, valorizar y gestionar residuos peligrosos industriales, detallando obligaciones de generadores, transportistas y destinatarios.",
        link: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf",
      },
      {
        id: "nom052",
        title: "NOM-052-SEMARNAT-2005: Identificación de Residuos Peligrosos",
        content:
          "Define las características CRETIB (Corrosivo, Reactivo, Explosivo, Tóxico, Inflamable, Biológico-infeccioso) y el procedimiento para identificar y clasificar residuos peligrosos industriales. Es indispensable para tu labor diaria.",
        link: "https://www.dof.gob.mx/normasOficiales/1055/SEMARNA/SEMARNA.htm",
      },
      {
        id: "nom002sct",
        title: "NOM-002-SCT/2011: Transporte de Sustancias Peligrosas",
        content:
          "Norma esencial para el transporte terrestre de residuos peligrosos industriales: establece requisitos de embalaje, etiquetado, rotulado y condiciones de seguridad para los vehículos.",
        link: "https://www.dof.gob.mx/normasOficiales/4623/SCT2a/SCT2a.htm",
      },
      {
        id: "responsabilidades",
        title: "Responsabilidades Clave del Recolector",
        content:
          "• Verificar el etiquetado y estado de los envases.\n• Segregar adecuadamente los residuos según sus características.\n• Transportar de forma segura y con manifiestos.\n• Asegurar la entrega a destinatarios autorizados.",
      },
    ],
  },
  {
    id: "identificacion",
    title: "2. Identificación de Residuos (CRETIB)",
    icon: "search",
    content: "Debes identificar correctamente los residuos peligrosos industriales para su manejo seguro.",
    subItems: [
      {
        id: "cretib",
        title: "Características CRETIB",
        content:
          "• C: Corrosivo – Ácidos, álcalis fuertes.\n• R: Reactivo – Sustancias inestables.\n• E: Explosivo – Materiales que pueden detonar.\n• T: Tóxico – Metales pesados, solventes.\n• I: Inflamable – Aceites, disolventes, pinturas.",
      },
      {
        id: "senales",
        title: "Señales de Alerta",
        content:
          "• Olores químicos fuertes o inusuales.\n• Derrames, fugas o manchas.\n• Envases dañados o sin etiqueta.\n• Cambios en el color o textura de residuos conocidos.",
      },
    ],
  },
  {
    id: "epp",
    title: "3. Equipo de Protección Personal (EPP)",
    icon: "security",
    content: "Tu seguridad es primero. Usa siempre el EPP adecuado cuando manejes residuos peligrosos industriales.",
    subItems: [
      {
        id: "eppIndispensable",
        title: "EPP Indispensable",
        content:
          "• Guantes resistentes a químicos.\n• Gafas de seguridad.\n• Mascarilla o respirador.\n• Calzado con puntera de acero.\n• Ropa de manga larga y chaleco reflectante.",
      },
      {
        id: "mantenimiento",
        title: "Mantenimiento del EPP",
        content:
          "• Inspecciona antes de cada uso.\n• Límpialo y almacénalo en buen estado.\n• Reemplázalo inmediatamente si está dañado.",
      },
    ],
  },
  {
    id: "recoleccion",
    title: "4. Procedimientos de Recolección y Segregación",
    icon: "inventory",
    content: "Aplica procedimientos correctos al recolectar residuos peligrosos industriales para evitar riesgos.",
    subItems: [
      {
        id: "procedimiento",
        title: "Buenas Prácticas de Recolección",
        content:
          "• Evalúa el área antes de recoger.\n• Usa el EPP adecuado.\n• No mezcles residuos peligrosos con no peligrosos ni diferentes tipos de residuos peligrosos.\n• Utiliza herramientas como pinzas para evitar el contacto directo.",
      },
      {
        id: "etiquetado",
        title: "Etiquetado y Envase",
        content:
          "• Usa contenedores compatibles con el residuo.\n• Etiqueta cada recipiente con: nombre del residuo, características CRETIB, fecha de recolección, generador.\n• No llenes los envases hasta el tope.",
      },
    ],
  },
  {
    id: "transporte",
    title: "5. Transporte Seguro y Documentación",
    icon: "local-shipping",
    content: "Asegura el transporte correcto de residuos peligrosos industriales con la documentación requerida.",
    subItems: [
      {
        id: "carga",
        title: "Carga y Seguridad en el Vehículo",
        content:
          "• Asegura contenedores para evitar movimientos.\n• No sobrecargues el vehículo.\n• Verifica que los envases estén cerrados herméticamente.",
      },
      {
        id: "documentacion",
        title: "Manifiesto de Residuos Peligrosos",
        content:
          "• Documento legal indispensable que detalla tipo, cantidad, origen y destino del residuo.\n• Llévalo siempre contigo durante el transporte.",
      },
    ],
  },
  {
    id: "emergencias",
    title: "6. Manejo de Derrames y Emergencias",
    icon: "warning",
    content: "Debes estar preparado para responder ante incidentes durante el manejo o transporte.",
    subItems: [
      {
        id: "derrames",
        title: "En Caso de Derrame",
        content:
          "• Activa tu EPP.\n• Contén el derrame con material absorbente.\n• Coloca el residuo contaminado en un recipiente seguro y etiquétalo.\n• Reporta el incidente.",
      },
      {
        id: "contacto",
        title: "En Caso de Contacto o Exposición",
        content:
          "• Lava la zona afectada con agua y jabón.\n• Retira ropa contaminada.\n• Busca atención médica inmediata.",
      },
      {
        id: "numeros",
        title: "Números de Emergencia",
        content:
          "• Emergencias: 911\n• CENACOM (para emergencias químicas): 800 00 45226\n• Protección Civil Local: busca el número en tu localidad.",
      },
    ],
  },
]

const AccordionItem = ({ title, content, icon, subItems, link }) => {
  const [expanded, setExpanded] = useState(false)

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded(!expanded)
  }

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch((err) => Alert.alert("Error", "No se pudo abrir el enlace: " + url))
  }

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity onPress={toggleExpand} style={styles.accordionHeader}>
        <View style={styles.headerContent}>
          {icon && <MaterialIcons name={icon} size={24} color="#4A90E2" style={styles.headerIcon} />}
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <MaterialIcons name={expanded ? "expand-less" : "expand-more"} size={24} color="#4A90E2" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionContent}>
          {content && <Text style={styles.accordionText}>{content}</Text>}
          {link && (
            <TouchableOpacity onPress={() => handleLinkPress(link)} style={styles.linkButton}>
              <MaterialIcons name="open-in-new" size={16} color="#FFFFFF" />
              <Text style={styles.linkButtonText}>Ver Documento Oficial</Text>
            </TouchableOpacity>
          )}
          {subItems &&
            subItems.map((subItem) => (
              <AccordionItem key={subItem.id} title={subItem.title} content={subItem.content} link={subItem.link} />
            ))}
        </View>
      )}
    </View>
  )
}

export default function InfoScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

      {/* Header */}
      <LinearGradient colors={["#4A90E2", "#357ABD"]} style={styles.header}>
        <MaterialIcons name="info" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Centro de Información</Text>
        <Text style={styles.headerSubtitle}>Guía esencial para recolectores de residuos peligrosos</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {infoSections.map((section) => (
          <AccordionItem
            key={section.id}
            title={section.title}
            content={section.content}
            icon={section.icon}
            subItems={section.subItems}
          />
        ))}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  accordionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flexShrink: 1,
  },
  accordionContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#F8FAFC",
  },
  accordionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
})
