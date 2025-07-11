using Microsoft.Data.SqlClient;  // Cambiado aquí
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
            throw;
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
                new SqlDataAdapter(command).Fill(table);  // SqlDataAdapter también de Microsoft.Data.SqlClient
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

    public static object ExecuteScalar(SqlCommand command)
    {
        using (var connection = GetConnection())
        {
            try
            {
                command.Connection = connection;
                return command.ExecuteScalar();
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error en ExecuteScalar: {e.Message}");
                throw;
            }
        }
    }

    public static void ExecuteCommand(SqlCommand command)
    {
        using (var connection = GetConnection())
        {
            try
            {
                command.Connection = connection;
                command.ExecuteNonQuery();
                Console.WriteLine("Comando ejecutado correctamente.");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error en ExecuteCommand: {e.Message}");
                throw;
            }
        }
    }
}
