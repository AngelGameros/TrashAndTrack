using System;
using System.Collections.Generic;
using System.Data;

public class RutaMapper
{
    public static Ruta ToObject(DataRow row)
    {
        return new Ruta
        {
            IdRuta = Convert.ToInt32(row["id_ruta"]),
            NombreRuta = row["nombre_ruta"].ToString(),
            FechaCreacion = Convert.ToDateTime(row["fecha_creacion"]),
            Descripcion = row["descripcion"].ToString(),
            IdEmpresa = Convert.ToInt32(row["id_empresa"]),
            IdPlanta = Convert.ToInt32(row["id_planta"])
        };
    }

    public static List<Ruta> ToList(DataTable table)
    {
        List<Ruta> list = new List<Ruta>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }

        return list;
    }
}