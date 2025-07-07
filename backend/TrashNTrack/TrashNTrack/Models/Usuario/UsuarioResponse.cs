public class UsuarioResponse : JsonResponse
{
    public Usuario Usuario { get; set; }

    public static UsuarioResponse GetResponse(Usuario u)
    {
        UsuarioResponse r = new UsuarioResponse();
        r.Status = 0;
        r.Usuario = u;
        return r;
    }
}
