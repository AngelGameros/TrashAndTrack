using System.Collections.Generic;
using System.Linq;

public class ItinerarioListResponse
{
    public static object GetResponse(List<Itinerario> itinerarios)
    {
        return new
        {
            status = 0,
            message = "Lista de itinerarios obtenida correctamente",
            data = itinerarios.Select(i => new
            {
                id = i.IdItinerario,
                estado = i.Estado,
                fechaProgramada = i.FechaProgramada.ToString("yyyy-MM-dd HH:mm"),
                idUsuario = i.IdUsuario,
                idRuta = i.IdRuta
            }).ToList()
        };
    }
}