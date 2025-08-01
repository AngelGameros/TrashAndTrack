﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

public static class RutaDetalladaMapper
{
    public static List<RutaDetalladaViewModel> MapFromDataTable(DataTable table)
    {
        var list = new List<RutaDetalladaViewModel>();

        foreach (DataRow row in table.Rows)
        {
            list.Add(new RutaDetalladaViewModel
            {
                id_ruta = Convert.ToInt32(row["id_ruta"]),
                nombre_ruta = row["nombre_ruta"].ToString(),
                fecha_creacion = Convert.ToDateTime(row["fecha_creacion"]),
                descripcion_ruta = row["descripcion_ruta"].ToString(),
                estado_ruta = row["estado_ruta"].ToString(),
                progreso_ruta = Convert.ToInt32(row["progreso_ruta"]),
                id_usuario_asignado = row["id_usuario_asignado"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["id_usuario_asignado"]),
                id_planta = Convert.ToInt32(row["id_planta"]),
                nombre_planta = row["nombre_planta"].ToString(),
                direccion_planta = row["direccion_planta"].ToString(),
                latitud_planta = Convert.ToDouble(row["latitud_planta"]),
                longitud_planta = Convert.ToDouble(row["longitud_planta"]),

                empresas_json = row["empresas_json"].ToString(),
                coordenadas_inicio_json = row["coordenadas_inicio_json"].ToString(),
                coordenadas_ruta_json = row["coordenadas_ruta_json"].ToString()
            });
        }

        return list;
    }
}
