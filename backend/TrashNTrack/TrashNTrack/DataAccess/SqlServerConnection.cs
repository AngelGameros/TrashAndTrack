using System.Data.SqlClient;
using System.Data;
using System;

public class SqlServerConnection
{
    private static string connectionString = BuildConnectionString();

    private static string BuildConnectionString()
    {
        Console.WriteLine("Construyendo cadena de conexión...");
        var builder = new SqlConnectionStringBuilder
        {
            DataSource = Config.Configuration.SqlServer.Server,
            InitialCatalog = Config.Configuration.SqlServer.Database,
            IntegratedSecurity = true, // Para Trusted_Connection=True
            TrustServerCertificate = true
        };

        // Solo agrega usuario/contraseña si se especifican
        if (!string.IsNullOrEmpty(Config.Configuration.SqlServer.Usuario))
        {
            builder.UserID = Config.Configuration.SqlServer.Usuario;
            builder.Password = Config.Configuration.SqlServer.Password;
            builder.IntegratedSecurity = false;
        }

        var connString = builder.ToString();
        Console.WriteLine($"Cadena de conexión: {connString}");
        return connString;
    }

    private static SqlConnection GetConnection()
    {
        var connection = new SqlConnection(connectionString);
        try
        {
            connection.Open();
            Console.WriteLine("Conexión abierta exitosamente");
            return connection;
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error al abrir conexión: {e.Message}");
            throw; // Relanza la excepción para manejo superior
        }
    }

    public static DataTable ExecuteQuery(SqlCommand command)
    {
        var table = new DataTable();
        using (var connection = GetConnection())
        {
            try
            {
                command.Connection = connection;
                new SqlDataAdapter(command).Fill(table);
                Console.WriteLine($"Consulta ejecutada. Filas obtenidas: {table.Rows.Count}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error en ExecuteQuery: {e.Message}");
                throw;
            }
        }
        return table;
    }
}