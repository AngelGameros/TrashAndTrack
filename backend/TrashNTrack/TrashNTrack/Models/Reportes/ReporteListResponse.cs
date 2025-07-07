using System.Collections.Generic;
using System.Linq;

public class ReporteListResponse
{
    public static object GetResponse(List<Reporte> reportes)
    {
        return new
        {
            status = 0,
            message = "Lista de reportes obtenida correctamente",
            data = reportes.Select(r => new
            {
                id = r.IdReporte,
                nombre = r.Nombre,
                fechaReporte = r.FechaReporte.ToString("yyyy-MM-dd HH:mm:ss"),
                photoUrl = r.PhotoUrl,
                descripcion = r.Descripcion,
                idUsuario = r.IdUsuario
            }).ToList()
        };
    }
}