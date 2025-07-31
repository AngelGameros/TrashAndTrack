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

        // Obtener usuario por Firebase UID
        [HttpGet]
        [Route("firebase/{uid}")]
        public ActionResult GetByFirebaseUid(string uid)
        {
            try
            {
                // Necesitarás implementar este método en tu clase Usuario
                Usuario a = Usuario.GetByFirebaseUid(uid);
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

        

        public class PhoneUpdateRequest
        {
            public string firebase_uid { get; set; }
            public string numero_telefono { get; set; }
        }

        [HttpPost]
        [Route("")]
        public ActionResult Post([FromBody] Usuario usuario)
        {
            if (usuario == null)
                return BadRequest("Datos del usuario inválidos.");

            try
            {
                if (string.IsNullOrEmpty(usuario.TipoUsuario) || (usuario.TipoUsuario != "admin" && usuario.TipoUsuario != "recolector"))
                {
                    usuario.TipoUsuario = "recolector";
                }

                bool inserted = usuario.Insert();

                if (inserted)
                    return Ok(new { status = "success", message = "Usuario creado correctamente" });
                else
                    return BadRequest(new { status = "error", message = "No se pudo crear el usuario" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "error", message = ex.Message });
            }
        }

        [HttpPut("{id}")] 
        public ActionResult Put(int id, [FromBody] Usuario updatedUserData) 
        {

            if (updatedUserData == null || id <= 0)
            {

                return BadRequest(new { status = "error", message = "Datos del usuario inválidos o ID no válido." });
            }

            try
            {
                Usuario existingUser = Usuario.Get(id);

                existingUser.Nombre = updatedUserData.Nombre;
                existingUser.PrimerApellido = updatedUserData.PrimerApellido;
                existingUser.SegundoApellido = updatedUserData.SegundoApellido;
                existingUser.NumeroTelefono = updatedUserData.NumeroTelefono;

                bool updated = existingUser.Update();

                if (updated)
                {
                    return Ok(new { status = "success", message = "Usuario actualizado correctamente." });
                }
                else
                {
                    // Si el usuario existe pero no se realizaron cambios (ej. los datos enviados son idénticos a los actuales)
                    return StatusCode(200, new { status = "info", message = "Usuario encontrado, pero no se realizaron cambios." });
                }
            }
            catch (UsuarioNotFoundException)
            {
                // Captura la excepción si el método Usuario.Get(id) no encuentra el usuario
                return NotFound(new { status = "error", message = $"Usuario con ID {id} no encontrado." });
            }
            catch (Exception ex)
            {
                // Manejo de cualquier otra excepción inesperada
                Console.WriteLine($"ERROR EN CONTROLADOR PUT: {ex.ToString()}"); // Para depuración en consola del servidor
                return StatusCode(500, new { status = "error", message = "Error interno del servidor al actualizar el usuario: " + ex.Message });
            }
        }
    



    }
}
