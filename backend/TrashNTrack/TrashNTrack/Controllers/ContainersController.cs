using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using MongoDB.Driver;
using MongoDB.Bson; // Asegúrate de tener esta importación

[ApiController]
[Route("api/[controller]")] // Ruta base: /api/containers
public class ContainersController : ControllerBase
{
    private readonly MongoDbConnection _mongoDbConnection;

    public ContainersController()
    {
        _mongoDbConnection = new MongoDbConnection();
    }

    [HttpGet]
    public async Task<ActionResult<List<ContainerData>>> GetAllContainers()
    {
        try
        {
            var collection = _mongoDbConnection.GetCollection<ContainerData>();
            var containers = await collection.Find(_ => true).ToListAsync();

            // Devuelve lista vacía en lugar de NotFound
            if (containers == null || containers.Count == 0)
            {
                Console.WriteLine("No se encontraron contenedores. Devolviendo lista vacía.");
                return new List<ContainerData>();
            }

            Console.WriteLine($"Se recuperaron {containers.Count} contenedores de la base de datos.");
            return Ok(containers);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error al obtener todos los contenedores: {ex.Message}");
            return StatusCode(500, $"Error interno del servidor: {ex.Message}");
        }
    }

    [HttpPost("batch-update")]
    public async Task<IActionResult> BatchUpdateContainers([FromBody] List<ContainerData> containers)
    {
        if (containers == null || containers.Count == 0)
        {
            return BadRequest(new { error = "No se recibieron datos de contenedores." });
        }

        try
        {
            var collection = _mongoDbConnection.GetCollection<ContainerData>();
            var results = new List<object>();
            var insertedIds = new List<string>();

            foreach (var container in containers)
            {
                // Buscar por DeviceID en lugar de Id para evitar duplicados
                var existing = await collection.Find(c => c.DeviceID == container.DeviceID).FirstOrDefaultAsync();

                if (existing == null)
                {
                    // Nuevo contenedor
                    container.Id = ObjectId.GenerateNewId().ToString();
                    container.LastUpdated = DateTime.UtcNow;

                    await collection.InsertOneAsync(container);

                    insertedIds.Add(container.Id);
                    results.Add(new { action = "inserted", id = container.Id });

                    Console.WriteLine($"Nuevo contenedor insertado: {container.DeviceID}");
                }
                else
                {
                    // Contenedor existente: actualizar
                    var filter = Builders<ContainerData>.Filter.Eq(c => c.DeviceID, container.DeviceID);
                    var update = Builders<ContainerData>.Update
                        .Set(c => c.ClientID, container.ClientID)
                        .Set(c => c.Name, container.Name)
                        .Set(c => c.Status, container.Status)
                        .Set(c => c.Type, container.Type)
                        .Set(c => c.MaxWeight_kg, container.MaxWeight_kg)
                        .Set(c => c.Values, container.Values)
                        .Set(c => c.LastUpdated, DateTime.UtcNow);

                    var result = await collection.UpdateOneAsync(filter, update);

                    results.Add(new
                    {
                        action = result.ModifiedCount > 0 ? "updated" : "unchanged",
                        id = existing.Id
                    });

                    Console.WriteLine($"Contenedor actualizado: {container.DeviceID} (ID: {existing.Id})");
                }
            }

            return Ok(new
            {
                message = $"Procesados {containers.Count} contenedores",
                details = results,
                insertedIds = insertedIds
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error al procesar batch-update: {ex.Message}");
            return StatusCode(500, new { error = ex.Message });
        }
    }

}
