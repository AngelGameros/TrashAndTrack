using System.Collections.Generic;
using System.Linq;
using System; // Agrega esto para DateTime

public class IncidenteListResponse
{
    public static object GetResponse(List<Incidente> incidentes)
    {
        return new
        {
            status = 0,
            message = "Lista de incidentes obtenida correctamente",
            data = incidentes.Select(i =>
            {
                // Asegurarse de que la fecha se convierta a UTC antes de formatearla como ISO con 'Z'
                DateTime fechaUtc = i.FechaIncidente;
                if (i.FechaIncidente.Kind == DateTimeKind.Unspecified)
                {
                    fechaUtc = DateTime.SpecifyKind(i.FechaIncidente, DateTimeKind.Utc);
                }
                else if (i.FechaIncidente.Kind == DateTimeKind.Local)
                {
                    fechaUtc = i.FechaIncidente.ToUniversalTime();
                }

                return new
                {
                    id = i.IdIncidente,
                    nombre = i.Nombre,
                    // Usar "o" (round-trip format) que incluye el 'Z' si DateTimeKind es Utc
                    fechaIncidente = fechaUtc.ToString("o"), 
                    photoUrl = i.PhotoUrl,
                    descripcion = i.Descripcion,
                    idUsuario = i.IdUsuario
                };
            }).ToList()
        };
    }
}