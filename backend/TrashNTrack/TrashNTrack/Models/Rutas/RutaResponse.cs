public class RutaResponse
{
    public static object GetResponse(Ruta ruta)
    {
        return new
        {
            status = 0,
            message = "Ruta obtenida correctamente",
            data = new
            {
                id = ruta.IdRuta,
                nombre = ruta.NombreRuta,
                fechaCreacion = ruta.FechaCreacion.ToString("yyyy-MM-dd"),
                descripcion = ruta.Descripcion,
                idEmpresa = ruta.IdEmpresa,
                idPlanta = ruta.IdPlanta
            }
        };
    }
}