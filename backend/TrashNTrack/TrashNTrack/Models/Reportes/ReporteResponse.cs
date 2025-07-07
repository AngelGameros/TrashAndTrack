public class ReporteResponse
{
    public static object GetResponse(Reporte reporte)
    {
        return new
        {
            status = 0,
            message = "Reporte obtenido correctamente",
            data = new
            {
                id = reporte.IdReporte,
                nombre = reporte.Nombre,
                fechaReporte = reporte.FechaReporte.ToString("yyyy-MM-dd HH:mm:ss"),
                photoUrl = reporte.PhotoUrl,
                descripcion = reporte.Descripcion,
                idUsuario = reporte.IdUsuario
            }
        };
    }
}