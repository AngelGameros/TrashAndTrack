using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace TrashNTrack.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        [HttpGet]
        [Route("")]
        public ActionResult Get()
        {
            try
            {
                var usuarios = Usuario.Get();

                // Pasa la lista de usuarios al método GetResponse
                var response = UsuarioListResponse.GetResponse();
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR EN CONTROLADOR: {ex.ToString()}");
                return StatusCode(500, new
                {
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        // GET api/<UsuariosController>/5
        [HttpGet]
        [Route("{id}")]
        public ActionResult Get(int id)
        {
            try
            {
                Usuario a = Usuario.Get(id);
                return Ok(UsuarioResponse.GetResponse(a));
            }
            catch (UsuarioNotFoundException e)
            {
                return Ok(MessageResponse.GetResponse(1, e.Message, MessageType.Error));
            }
            catch (Exception e)
            {
                return Ok(MessageResponse.GetResponse(999, e.Message, MessageType.Error));
            }
        }

        [HttpPost]
        [Route("")]
        public ActionResult Post()
        {
            return Ok("post");
        }
    }
}
