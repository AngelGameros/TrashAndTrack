using System.Collections.Generic;
using System.Data;

public class UsuarioMapper
{
    public static Usuario ToObject(DataRow row)
    {
        try
        {
            if (row == null)
                throw new ArgumentNullException(nameof(row), "DataRow no puede ser nulo");

            int id_usuario = GetValue<int>(row, "id_usuario");
            string nombre = GetValue<string>(row, "nombre");
            string primer_apellido = GetValue<string>(row, "primer_apellido");
            string segundo_apellido = GetValue<string>(row, "segundo_apellido");
            string correo = GetValue<string>(row, "correo");
            string numero_telefono = GetValue<string>(row, "numero_telefono");
            string firebase_uid = GetValue<string>(row, "firebase_uid");

            return new Usuario(id_usuario, nombre, primer_apellido, segundo_apellido, correo, numero_telefono, firebase_uid);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al mapear DataRow a Usuario: {ex.Message}");
            throw new UsuarioMappingException("Error en el mapeo de Usuario", ex);
        }
    }

    public static List<Usuario> ToList(DataTable table)
    {
        List<Usuario> list = new List<Usuario>();

        if (table == null || table.Rows.Count == 0)
        {
            Console.WriteLine("Advertencia: DataTable vacío o nulo recibido en ToList");
            return list;
        }

        try
        {
            foreach (DataRow row in table.Rows)
                list.Add(ToObject(row));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al convertir DataTable a List<Usuario>: {ex.Message}");
            throw;
        }

        Console.WriteLine($"Se mapearon {list.Count} usuarios correctamente");
        return list;
    }

    private static T GetValue<T>(DataRow row, string columnName)
    {
        if (!row.Table.Columns.Contains(columnName))
            throw new ArgumentException($"La columna {columnName} no existe en el DataRow");

        if (row.IsNull(columnName))
            return default(T);

        return (T)Convert.ChangeType(row[columnName], typeof(T));
    }
}

public class UsuarioMappingException : Exception
{
    public UsuarioMappingException(string message, Exception innerException)
        : base(message, innerException) { }
}
