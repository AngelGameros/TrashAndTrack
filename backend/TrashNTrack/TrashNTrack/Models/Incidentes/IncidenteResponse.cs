public class IncidenteResponse
{
    public static object GetResponse(Incidente incidente)
    {
        return new
        {
            status = 0,
            message = "Incidente obtenido correctamente",
            data = new
            {
                id = incidente.IdIncidente,
                nombre = incidente.Nombre,
                fechaIncidente = incidente.FechaIncidente.ToString("yyyy-MM-dd HH:mm:ss"),
                photoUrl = incidente.PhotoUrl,
                descripcion = incidente.Descripcion,
                idUsuario = incidente.IdUsuario
            }
        };
    }

    public static object GetCreateResponse(int id)
    {
        return new
        {
            status = 0,
            message = "Incidente creado correctamente",
            data = new { id }
        };
    }
}