using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class UsuarioNotFoundException: Exception
{
    private string _message;

    public override string Message => _message;

    public UsuarioNotFoundException(int id)
    {
        _message = "Could not find Usuario with id " + id.ToString();
    }
}