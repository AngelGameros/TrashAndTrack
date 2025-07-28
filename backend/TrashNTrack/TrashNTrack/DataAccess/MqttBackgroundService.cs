using MQTTnet;
using MQTTnet.Extensions.ManagedClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using MQTTnet.Client;
using System.Globalization;

public class MqttBackgroundService : BackgroundService
{
    private readonly ILogger<MqttBackgroundService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private IManagedMqttClient _mqttClient;
    private MongoDbConnection _mongoDb;

    public MqttBackgroundService(ILogger<MqttBackgroundService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // ✅ Esperar a que ASP.NET Core termine de inicializarse
        await Task.Delay(2000, stoppingToken);

        // ✅ Ahora inicializar MongoDB
        _mongoDb = _serviceProvider.GetRequiredService<MongoDbConnection>();

        // ✅ Pequeña pausa antes de iniciar MQTT
        await Task.Delay(500, stoppingToken);

        _logger.LogInformation("[MQTT] Background Service initialized");
        _logger.LogInformation("[MQTT] ========================================");
        _logger.LogInformation("[MQTT] STARTING MQTT SERVICE");
        _logger.LogInformation("[MQTT] ========================================");

        try
        {
            var mqttFactory = new MqttFactory();
            _mqttClient = mqttFactory.CreateManagedMqttClient();
            _logger.LogInformation("[MQTT] Client created successfully");

            var clientOptions = new MqttClientOptionsBuilder()
                .WithTcpServer("broker.emqx.io")
                .WithClientId("backend-tracker")
                .Build();

            var managedOptions = new ManagedMqttClientOptionsBuilder()
                .WithClientOptions(clientOptions)
                .Build();

            _logger.LogInformation("[MQTT] Configuration: Server=broker.emqx.io, ClientId=backend-tracker");

            _mqttClient.ApplicationMessageReceivedAsync += async e =>
            {
                _logger.LogInformation("[MQTT] ----------------------------------------");
                _logger.LogInformation("[MQTT] NEW MESSAGE RECEIVED");
                _logger.LogInformation("[MQTT] ----------------------------------------");

                var topic = e.ApplicationMessage.Topic;
                var payloadRaw = e.ApplicationMessage.Payload == null ? "<no data>" : Encoding.UTF8.GetString(e.ApplicationMessage.Payload);
                var qos = e.ApplicationMessage.QualityOfServiceLevel;

                _logger.LogInformation("[MQTT] Topic: {Topic}", topic);
                _logger.LogInformation("[MQTT] Payload: {Payload}", payloadRaw);
                _logger.LogInformation("[MQTT] QoS: {Qos}", qos);

                try
                {
                    // ✅ Configurar opciones de JSON para manejar fechas correctamente
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        // ✅ Configurar el formato de fecha para ISO 8601
                        Converters = { new CustomDateTimeConverter() }
                    };

                    // ✅ Deserializar directamente a ContainerData
                    var container = JsonSerializer.Deserialize<ContainerData>(payloadRaw, options);
                    if (container != null)
                    {
                        _logger.LogInformation("[MQTT] Data deserialized successfully");
                        _logger.LogInformation("[MQTT] Original LastUpdated from ESP32: {OriginalDate}", container.LastUpdated);

                        // ✅ NO modificar la fecha que viene del ESP32, solo asegurar que esté en UTC
                        if (container.LastUpdated.Kind != DateTimeKind.Utc)
                        {
                            container.LastUpdated = DateTime.SpecifyKind(container.LastUpdated, DateTimeKind.Utc);
                        }

                        _logger.LogInformation("[MQTT] Final LastUpdated (UTC): {FinalDate}", container.LastUpdated);
                        _logger.LogInformation("[MQTT] Container ready for insert. DeviceID: {DeviceID}", container.DeviceID);

                        await _mongoDb.InsertContainerReading(container);
                        _logger.LogInformation("[MQTT] Message processing completed successfully");
                    }
                    else
                    {
                        _logger.LogWarning("[MQTT] Deserialized object is null");
                    }
                }
                catch (JsonException je)
                {
                    _logger.LogError(je, "[MQTT] JSON deserialization error");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[MQTT] Unexpected error processing message");
                }

                _logger.LogInformation("[MQTT] ----------------------------------------");
            };

            _mqttClient.ConnectedAsync += async e =>
            {
                _logger.LogInformation("[MQTT] *** CONNECTED TO BROKER ***");
                await _mqttClient.SubscribeAsync("UTT/TRASHANDTRACK");
                _logger.LogInformation("[MQTT] *** SUBSCRIBED TO TOPIC: UTT/TRASHANDTRACK ***");
            };

            _mqttClient.DisconnectedAsync += async e =>
            {
                _logger.LogWarning("[MQTT] *** DISCONNECTED FROM BROKER *** Reason: {Reason}", e.Reason);
                await Task.CompletedTask;
            };

            _logger.LogInformation("[MQTT] Initiating connection to broker...");
            await _mqttClient.StartAsync(managedOptions);
            _logger.LogInformation("[MQTT] ========================================");
            _logger.LogInformation("[MQTT] SERVICE READY - LISTENING FOR MESSAGES");
            _logger.LogInformation("[MQTT] ========================================");

            // Esperar hasta que se cancele el token
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (TaskCanceledException)
        {
            _logger.LogInformation("[MQTT] Service stopped by cancellation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[MQTT] Critical error in service");
            throw;
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("[MQTT] ========================================");
        _logger.LogInformation("[MQTT] STOPPING SERVICE");
        _logger.LogInformation("[MQTT] ========================================");

        if (_mqttClient != null)
        {
            await _mqttClient.StopAsync();
            _logger.LogInformation("[MQTT] Client stopped successfully");
        }

        await base.StopAsync(cancellationToken);
        _logger.LogInformation("[MQTT] *** SERVICE STOPPED ***");
    }
}

// ✅ Convertidor personalizado para fechas ISO 8601
public class CustomDateTimeConverter : System.Text.Json.Serialization.JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dateString = reader.GetString();
        if (DateTime.TryParse(dateString, null, DateTimeStyles.RoundtripKind, out var result))
        {
            // Si la fecha ya tiene información de zona horaria, respetarla
            if (result.Kind == DateTimeKind.Utc || dateString.EndsWith("Z"))
            {
                return DateTime.SpecifyKind(result, DateTimeKind.Utc);
            }
            // Si no tiene zona horaria, asumir que es UTC
            return DateTime.SpecifyKind(result, DateTimeKind.Utc);
        }

        // Fallback: usar la fecha actual si no se puede parsear
        return DateTime.UtcNow;
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}
