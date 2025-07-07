using System.Collections.Generic;
using System.Data;

public class TipoResiduosMapper
{
    public static TipoResiduos ToObject(DataRow row)
    {
        int idTipoResiduos = (int)row["id_tipo_residuo"];
        string nombre = row["nombre"].ToString();
        string descripcion = row["descripcion"]?.ToString() ?? "";

        return new TipoResiduos(idTipoResiduos, nombre, descripcion);
    }

    public static List<TipoResiduos> ToList(DataTable table)
    {
        List<TipoResiduos> list = new List<TipoResiduos>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
