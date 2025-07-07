using System.Collections.Generic;
using System.Data;

public class TipoContenedoresMapper
{
    public static TipoContenedores ToObject(DataRow row)
    {
        int idTipoContenedor = (int)row["id_tipo_contenedor"];
        string nombre = row["nombre"].ToString();
        string descripcion = row["descripcion"]?.ToString() ?? "";
        double capacidadMaxima = row["capacidad_maxima"] != DBNull.Value ? Convert.ToDouble(row["capacidad_maxima"]) : 0;

        return new TipoContenedores(idTipoContenedor, nombre, descripcion, capacidadMaxima);
    }

    public static List<TipoContenedores> ToList(DataTable table)
    {
        List<TipoContenedores> list = new List<TipoContenedores>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
