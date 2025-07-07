using System;
using System.Collections.Generic;
using System.Data;

public class IncidenteMapper
{
    public static Incidente ToObject(DataRow row)
    {
        return new Incidente
        {
            IdIncidente = Convert.ToInt32(row["id_incidente"]),
            Nombre = row["nombre"].ToString(),
            FechaIncidente = Convert.ToDateTime(row["fecha_incidente"]),
            PhotoUrl = row["photo_url"]?.ToString() ?? string.Empty,
            Descripcion = row["descripcion"].ToString(),
            IdUsuario = Convert.ToInt32(row["id_usuario"])
        };
    }

    public static List<Incidente> ToList(DataTable table)
    {
        List<Incidente> list = new List<Incidente>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }

        return list;
    }
}