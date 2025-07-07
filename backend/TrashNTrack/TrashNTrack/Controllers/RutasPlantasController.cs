[Route("api/[controller]")]
[ApiController]
public class RutasPlantasController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(RutaPlantaListResponse.GetResponse(RutaPlanta.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(RutaPlantaResponse.GetResponse(RutaPlanta.GetById(id)));
}
