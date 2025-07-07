using System;
using System.Collections.Generic;
using System.Data;

public class EmpresaMapper
{
    public static Empresa ToObject(DataRow row)
    {
        return new Empresa
        {
            IdEmpresa = Convert.ToInt32(row["id_empresa"]),
            Nombre = row["nombre"].ToString(),
            FechaRegistro = Convert.ToDateTime(row["fecha_registro"]),
            RFC = row["rfc"].ToString(),
            IdUbicacion = Convert.ToInt32(row["id_ubicacion"])
        };
    }

    public static List<Empresa> ToList(DataTable table)
    {
        List<Empresa> list = new List<Empresa>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }

        return list;
    }
}