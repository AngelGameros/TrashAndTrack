using System.Collections.Generic;

public class TipoContenedoresListResponse : JsonResponse
{
    public List<TipoContenedores> TiposContenedores { get; set; }

    public static TipoContenedoresListResponse GetResponse()
    {
        TipoContenedoresListResponse r = new TipoContenedoresListResponse();
        r.Status = 0;
        r.TiposContenedores = TipoContenedores.Get();
        return r;
    }
}
