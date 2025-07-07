[Route("api/[controller]")]
[ApiController]
public class TipoContenedoresController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(TipoContenedorListResponse.GetResponse(TipoContenedor.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(TipoContenedorResponse.GetResponse(TipoContenedor.GetById(id)));
}
