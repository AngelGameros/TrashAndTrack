using MongoDB.Driver;
using MongoDB.Bson;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

public class MongoDbConnection
{
    private readonly IMongoDatabase _database;

    public MongoDbConnection()
    {
        Console.WriteLine("[MONGODB] Inicializando conexión a MongoDB...");

        if (Config.Configuration == null || Config.Configuration.MongoDb == null)
        {
            Console.WriteLine("[MONGODB] Configuración de MongoDB no encontrada.");
            throw new InvalidOperationException("Configuración de MongoDB no cargada. Asegúrate de inicializar Config.Configuration al inicio de tu aplicación.");
        }

        try
        {
            Console.WriteLine($"[MONGODB] Intentando conectar a: {Config.Configuration.MongoDb.ConnectionString}");
            var client = new MongoClient(Config.Configuration.MongoDb.ConnectionString);
            _database = client.GetDatabase(Config.Configuration.MongoDb.DatabaseName);
            Console.WriteLine($"[MONGODB] Conexión a MongoDB exitosa. Base de datos: {Config.Configuration.MongoDb.DatabaseName}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MONGODB] Error al conectar a MongoDB: {ex.Message}");
            throw;
        }
    }

    // ✅ Método para obtener colección específica por nombre
    public IMongoCollection<TDocument> GetCollection<TDocument>(string collectionName)
    {
        Console.WriteLine($"[MONGODB] Accediendo a colección: {collectionName}");
        return _database.GetCollection<TDocument>(collectionName);
    }

    // ✅ Método para obtener colección por defecto (mantener compatibilidad)
    public IMongoCollection<TDocument> GetCollection<TDocument>()
    {
        var collectionName = Config.Configuration.MongoDb.CollectionName;
        return GetCollection<TDocument>(collectionName);
    }

    // ✅ Método para generar nombre de colección basado en DeviceID
    private string GetContainerCollectionName(string deviceId)
    {
        // Limpiar el deviceId para que sea un nombre válido de colección
        var cleanDeviceId = deviceId.Replace(" ", "_").Replace("-", "_").ToLower();
        return $"container_{cleanDeviceId}";
    }

    // ✅ Nuevo método específico para insertar lecturas de contenedores
    public async Task InsertContainerReading(ContainerData containerData)
    {
        if (containerData == null || string.IsNullOrEmpty(containerData.DeviceID))
        {
            Console.WriteLine("[MONGODB] Error: ContainerData o DeviceID es nulo");
            return;
        }

        try
        {
            // ✅ Generar nombre de colección específica para este contenedor
            var collectionName = GetContainerCollectionName(containerData.DeviceID);
            Console.WriteLine($"[MONGODB] Insertando lectura en colección: {collectionName}");

            // ✅ Obtener la colección específica del contenedor
            var collection = GetCollection<ContainerData>(collectionName);

            // ✅ Preparar el documento para inserción (generar nuevo ObjectId)
            containerData.PrepareForInsert();

            // ✅ Agregar timestamp de inserción si no existe
            if (containerData.LastUpdated == default(DateTime))
            {
                containerData.LastUpdated = DateTime.UtcNow;
            }

            Console.WriteLine($"[MONGODB] Insertando nueva lectura para contenedor: {containerData.DeviceID}");
            Console.WriteLine($"[MONGODB] Timestamp: {containerData.LastUpdated}");
            Console.WriteLine($"[MONGODB] Temperatura: {containerData.Values?.Temperature_C}°C");
            Console.WriteLine($"[MONGODB] Peso: {containerData.Values?.Weight_kg}kg");

            // ✅ Insertar como nuevo documento (no upsert, para mantener historial)
            await collection.InsertOneAsync(containerData);

            Console.WriteLine($"[MONGODB] ✅ Lectura insertada exitosamente en {collectionName}");

            // ✅ Mostrar estadísticas de la colección
            var totalReadings = await collection.CountDocumentsAsync(FilterDefinition<ContainerData>.Empty);
            Console.WriteLine($"[MONGODB] Total de lecturas para {containerData.DeviceID}: {totalReadings}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MONGODB] ❌ Error al insertar lectura del contenedor {containerData.DeviceID}: {ex.Message}");
            throw;
        }
    }

    // ✅ Método para obtener el último estado de un contenedor
    public async Task<ContainerData> GetLatestContainerReading(string deviceId)
    {
        try
        {
            var collectionName = GetContainerCollectionName(deviceId);
            var collection = GetCollection<ContainerData>(collectionName);

            // Obtener la lectura más reciente
            var latestReading = await collection
                .Find(FilterDefinition<ContainerData>.Empty)
                .SortByDescending(x => x.LastUpdated)
                .FirstOrDefaultAsync();

            return latestReading;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MONGODB] Error al obtener última lectura de {deviceId}: {ex.Message}");
            return null;
        }
    }

    // ✅ Método para obtener historial de un contenedor
    public async Task<List<ContainerData>> GetContainerHistory(string deviceId, int limit = 100)
    {
        try
        {
            var collectionName = GetContainerCollectionName(deviceId);
            var collection = GetCollection<ContainerData>(collectionName);

            var history = await collection
                .Find(FilterDefinition<ContainerData>.Empty)
                .SortByDescending(x => x.LastUpdated)
                .Limit(limit)
                .ToListAsync();

            Console.WriteLine($"[MONGODB] Obtenidas {history.Count} lecturas históricas de {deviceId}");
            return history;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MONGODB] Error al obtener historial de {deviceId}: {ex.Message}");
            return new List<ContainerData>();
        }
    }

    // ✅ Mantener método original para compatibilidad con otros documentos
    public async Task UpsertDocument<TDocument>(TDocument document) where TDocument : class
    {
        // Si es ContainerData, usar el nuevo método específico
        if (document is ContainerData containerData)
        {
            await InsertContainerReading(containerData);
            return;
        }

        // Código original para otros tipos de documentos
        var collection = GetCollection<TDocument>();

        try
        {
            var objectId = ((dynamic)document).Id;
            Console.WriteLine($"[MONGODB] Preparando upsert para documento con ID: {objectId}");

            var filter = Builders<TDocument>.Filter.Eq("_id", objectId);
            var options = new ReplaceOptions { IsUpsert = true };

            var result = await collection.ReplaceOneAsync(filter, document, options);

            if (result.IsAcknowledged)
            {
                if (result.ModifiedCount > 0)
                {
                    Console.WriteLine($"[MONGODB] Documento con ID {objectId} actualizado.");
                }
                else if (result.UpsertedId != null)
                {
                    Console.WriteLine($"[MONGODB] Documento nuevo insertado con ID generado: {result.UpsertedId}.");
                }
                else
                {
                    Console.WriteLine($"[MONGODB] Documento con ID {objectId} no modificado (idéntico al existente).");
                }
            }
            else
            {
                Console.WriteLine($"[MONGODB] Operación de upsert NO reconocida por MongoDB para ID {objectId}.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MONGODB] Error al hacer upsert del documento: {ex.Message}");
            throw;
        }
    }
}
