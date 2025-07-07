using System;
using System.Collections.Generic;
using System.Data;

public class ItinerarioMapper
{
    public static Itinerario ToObject(DataRow row)
    {
        return new Itinerario
        {
            IdItinerario = Convert.ToInt32(row["id_itinerario"]),
            Estado = row["estado"].ToString(),
            FechaProgramada = Convert.ToDateTime(row["fecha_programada"]),
            IdUsuario = Convert.ToInt32(row["id_usuario"]),
            IdRuta = Convert.ToInt32(row["id_ruta"])
        };
    }

    public static List<Itinerario> ToList(DataTable table)
    {
        List<Itinerario> list = new List<Itinerario>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }

        return list;
    }
}