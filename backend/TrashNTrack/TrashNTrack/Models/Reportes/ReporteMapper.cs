using System;
using System.Collections.Generic;
using System.Data;

public class ReporteMapper
{
    public static Reporte ToObject(DataRow row)
    {
        return new Reporte
        {
            IdReporte = Convert.ToInt32(row["id_reporte"]),
            Nombre = row["nombre"].ToString(),
            FechaReporte = Convert.ToDateTime(row["fecha_reporte"]),
            PhotoUrl = row["photo_url"]?.ToString() ?? string.Empty,
            Descripcion = row["descripcion"].ToString(),
            IdUsuario = Convert.ToInt32(row["id_usuario"])
        };
    }

    public static List<Reporte> ToList(DataTable table)
    {
        List<Reporte> list = new List<Reporte>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }

        return list;
    }
}