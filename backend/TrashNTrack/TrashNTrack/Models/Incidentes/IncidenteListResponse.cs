using System.Collections.Generic;
using System.Linq;

public class IncidenteListResponse
{
    public static object GetResponse(List<Incidente> incidentes)
    {
        return new
        {
            status = 0,
            message = "Lista de incidentes obtenida correctamente",
            data = incidentes.Select(i => new
            {
                id = i.IdIncidente,
                nombre = i.Nombre,
                fechaIncidente = i.FechaIncidente.ToString("yyyy-MM-dd HH:mm:ss"),
                photoUrl = i.PhotoUrl,
                descripcion = i.Descripcion,
                idUsuario = i.IdUsuario
            }).ToList()
        };
    }
}