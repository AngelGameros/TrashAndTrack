using System.Collections.Generic;
using System.Data;

public class UbicacionMapper
{
    public static Ubicacion ToObject(DataRow row)
    {
        try
        {
            if (row == null)
                throw new ArgumentNullException(nameof(row), "DataRow no puede ser nulo");

            int idUbicacion = GetValue<int>(row, "id_ubicacion");
            string direccion = GetValue<string>(row, "direccion");
            double latitud = row["latitud"] != DBNull.Value ? Convert.ToDouble(row["latitud"]) : 0;
            double longitud = row["longitud"] != DBNull.Value ? Convert.ToDouble(row["longitud"]) : 0;

            return new Ubicacion(idUbicacion, direccion, latitud, longitud);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al mapear DataRow a Ubicacion: {ex.Message}");
            throw new Exception("Error en el mapeo de Ubicacion", ex);
        }
    }

    public static List<Ubicacion> ToList(DataTable table)
    {
        List<Ubicacion> list = new List<Ubicacion>();
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
            Console.WriteLine($"Error al convertir DataTable a List<Ubicacion>: {ex.Message}");
            throw;
        }

        Console.WriteLine($"Se mapearon {list.Count} ubicaciones correctamente");
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
