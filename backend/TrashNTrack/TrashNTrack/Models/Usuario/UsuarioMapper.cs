using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class UsuarioMapper
{
    public static Usuario ToObject(DataRow row)
    {
        try
        {
            // Validación de fila
            if (row == null)
                throw new ArgumentNullException(nameof(row), "DataRow no puede ser nulo");

            // Mapeo seguro de columnas con verificación
            int id_usuario = GetValue<int>(row, "id_usuario");
            string primer_apell = GetValue<string>(row, "primer_apell");
            string segundo_apell = GetValue<string>(row, "segundo_apell");
            int firebase_uid = GetValue<int>(row, "firebase_uid");

            return new Usuario(id_usuario, primer_apell, segundo_apell, firebase_uid);
        }
        catch (Exception ex)
        {
            // Loggear error para diagnóstico
            Console.WriteLine($"Error al mapear DataRow a Usuario: {ex.Message}");
            throw new UsuarioMappingException("Error en el mapeo de Usuario", ex);
        }
    }

    public static List<Usuario> ToList(DataTable table)
    {
        var list = new List<Usuario>();

        if (table == null || table.Rows.Count == 0)
        {
            Console.WriteLine("Advertencia: DataTable vacío o nulo recibido en ToList");
            return list;
        }

        try
        {
            foreach (DataRow row in table.Rows)
            {
                list.Add(ToObject(row));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al convertir DataTable a List<Usuario>: {ex.Message}");
            throw;
        }

        Console.WriteLine($"Se mapearon {list.Count} usuarios correctamente");
        return list;
    }

    // Método auxiliar para obtener valores de forma segura
    private static T GetValue<T>(DataRow row, string columnName)
    {
        if (!row.Table.Columns.Contains(columnName))
            throw new ArgumentException($"La columna {columnName} no existe en el DataRow");

        if (row.IsNull(columnName))
            return default(T);

        try
        {
            return (T)Convert.ChangeType(row[columnName], typeof(T));
        }
        catch (InvalidCastException)
        {
            throw new InvalidCastException($"No se puede convertir {columnName} a {typeof(T).Name}");
        }
    }
}

// Excepción personalizada para errores de mapeo
public class UsuarioMappingException : Exception
{
    public UsuarioMappingException(string message, Exception innerException)
        : base(message, innerException) { }
}