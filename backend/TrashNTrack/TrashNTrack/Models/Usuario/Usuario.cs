using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class Usuario
{
    #region statements
    private static string UsuarioGetAll = @"
        SELECT id_usuario, nombre, primer_apellido, segundo_apellido, correo, numero_telefono, firebase_uid
        FROM USUARIOS ORDER BY id_usuario";

    private static string UsuarioGetOne = @"
        SELECT id_usuario, nombre, primer_apellido, segundo_apellido, correo, numero_telefono, firebase_uid
        FROM USUARIOS WHERE id_usuario = @ID";
    #endregion

    #region attributes
    private int _id_usuario;
    private string _nombre;
    private string _primer_apellido;
    private string _segundo_apellido;
    private string _correo;
    private string _numero_telefono;
    private string _firebase_uid;
    #endregion

    #region properties
    public int IdUsuario { get => _id_usuario; }
    public string Nombre { get => _nombre; set => _nombre = value; }
    public string PrimerApellido { get => _primer_apellido; set => _primer_apellido = value; }
    public string SegundoApellido { get => _segundo_apellido; set => _segundo_apellido = value; }
    public string Correo { get => _correo; set => _correo = value; }
    public string NumeroTelefono { get => _numero_telefono; set => _numero_telefono = value; }
    public string FirebaseUid { get => _firebase_uid; }
    #endregion

    #region constructors
    public Usuario()
    {
        _id_usuario = 0;
        _nombre = "";
        _primer_apellido = "";
        _segundo_apellido = "";
        _correo = "";
        _numero_telefono = "";
        _firebase_uid = "";
    }

    public Usuario(int id_usuario, string nombre, string primer_apellido, string segundo_apellido, string correo, string numero_telefono, string firebase_uid)
    {
        _id_usuario = id_usuario;
        _nombre = nombre;
        _primer_apellido = primer_apellido;
        _segundo_apellido = segundo_apellido;
        _correo = correo;
        _numero_telefono = numero_telefono;
        _firebase_uid = firebase_uid;
    }
    #endregion

    #region classMethods
    public static List<Usuario> Get()
    {
        SqlCommand command = new SqlCommand(UsuarioGetAll);
        return UsuarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Usuario Get(int id)
    {
        SqlCommand command = new SqlCommand(UsuarioGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return UsuarioMapper.ToObject(table.Rows[0]);
        else
            throw new UsuarioNotFoundException(id);
    }
    #endregion
}
