# MCP

- xVeo que el servidor MCP ha crecido mucho. No crees que deberiamos reestructurar algo o refactorizar o mejorar su seguridad?
- xTiene sentido añadir prompts?
- xEs posible que haya que mejorar las descripciones de las tools?
- xLanding detalle explicativa
    - https://mcp.crypto.com/docs
    - https://docs.coingecko.com/docs/mcp-server
    - https://help.fellow.ai/en/articles/12622641-fellow-s-mcp-server
- xMirar si las dependencias están actualizadas y no hay riesgos npm audit





FALTA
- xNo funciona npm run dev ni meter el mcp en antigravity
- xLa landing está rota
- xLogo de Bit2Me en la landing
- xFooter con links a Bit2Me
- xImplementar una suite de tests

- xDeberiamos mejorar las respuestas y ver si alguna necesita paginacion o mejores estructuras de repuesta
- xEn el readme deberíamos explicar que endpoints se usan y las respuestas que dará el tool, ejemplo https://github.com/crazyrabbitLTC/mcp-coingecko-server y poner la explicacion de instalacion.
- xSubir a github público
- xDesplegar landing
- xSubir a NPM


Veo algunos errores en landing y readme.md:
-x 300+ cryptocurrencies -> Hay que poner 400+
-x En las tools hay que poner que un disclaimer de que no están disponibles por el momento tools de retiro a blockchain o otros usuarios (por seguridad) , esto en el readme lo veo, pero no se si está en la landing.
-x Complementa el readme con los troubleshotting que falten.
-x Solo cuando no es responsive, el suggest box que sale al filtrar en el sidebar izquierdo, debería  mas ancho para no mostrar scrollbar horizontal.
-x En el bloque de instalacion de la landing, cuando cambias de tab no se pone el estilo de tab activada y desactiva la tab anterior. Aunque si que cambia el contenido, pero el tab en si mismo no actualiza los estilos correctamente.

En responsive:
-x Aparece un header arriba para el menu, lo cual ocupa un espacio, y cuando el scroll está arriba del todo, el texto del contenido se tapa un poco con este menu. Deberia tener un margen de seguridad.
-x Los botones de github y npm quedan overflow de la pantalla, deberian ponerse debajo del titulo para que se vea.
-x El esquema de arquitectura no se ve bien al ser una pantalla estrecha. Deberia convertirse en un esquema vertical en vez de horizontal como ahora.


- x Deberiamos probar todas las tools manualmente a ver que respuestas da y si son correctas
- x Estudiar dependabot a ver como funciona y las sugerencias que marca 
- x Ver esos deploys de github actions que fallan

- x Deberiamos meter en todas las respuestas del MCP un parametro raw con la respuesta del api?
- x Añadir analytics
- x Añadir security scanning ademas de dependabot?
- xCrear un LLMs.txt
- xMuchas tools en la documentacion de la landing no ponen estructura en el ejemplo
- xEl tool de chart prices tiene un campo fecha, pero no tiene la fecha y hora

- xImplementar esta tool: https://api.bit2me.com/#tag/Market/operation/currencyRate


---

- Poner capturas en la landing interesantes o algun video tutorial

----

- Una version remote server con oauth


----


- xEl MCP no devuelve en los precios del chart por mes todo el mes . Ni el one-weel está bien. Ni el one-year.
Ademas En market_get_chart llama symbol a lo que deberia ser pair.


- Tools que fallam: 
  - xearn_get_summary
  - xloan_get_order_details

- xEl MCP tiene muchas respuestas incompletas y tiene algunas que no funcionan. Hay que revisar todas a mano.

----

-x En Earn get summary no deberia los valores ser como string como parece que se definió?

-x earn_get_transactions no devuelve id, ni curerrency, y el date no es created at y no sigue ninguna regla de las que definimos.

-x Parece que la tool pro_cancel_all_orders no está bien implementada!
Da error: "Error executing pro_cancel_all_orders: Bit2Me API Error (404): Resource not found"
Te adjunto captura de la documentacion.
Tambien la tool pro_get_transactions tiene algun fallo que no devuelve resueltados.

---

- xConfunde MUCHO el hecho de que exista "transaction" en el nombre de la tool refiriendose a las transacciones, pero tambien a realizar un deposito, o un retiro.
En Pro tambien se llama transactions a los trades. Eso es incorrecto, porque son trades ¿no?

- Una vez funcionen implementemos los test end to end.

- earn_get_wallet_rewards_config pone next_distribution vacio.

- earn_get_wallet_rewards_summary devuelve los valores vacios

-x earn_get_apy no pone el porcentaje de un modo legible directamente.

-x Hay que actualizar toda la web y readme y ficheros de mapping, todo ha cambiado en las tools.

-x Implementar esta tool: https://gateway.qa.bit2me.com/doc/#/Earn/getMovementsV2

- x El tool market_get_asset_details para criptomonedas devuelve el type como "currenct", deberia decir "cryptocurrency" no? tambien en la tool market_get_assets pasa lo mismo. Ademas siguen habiendo muchas tools que siguen llamando symbol a veces, otras currency,.... Esto un desproposito total! Necesitamos buscar un termino adecuado y implementarlo de verdad en todos lados! Tanto en los parametros de la peticion, como en la respuesta. creo que asset_symbol para cryptomonedas podria ser una opcion. No se si crees que hay otra mejor.

- En las tools que hay parametros que sirven para indicar si queremos que se convierta el valor a otra cosa, por ejemplo en la tool market_get_currency_rate, me parece raro que el parametro que indica a que queremos convertir se llame solamente "fiat". Tal vez seria mejor al como "fiat_to_convert"? O no sigue un buen patron eso?

----


- Implementar codigo de conducta: https://github.com/nitrojs/nitro?tab=coc-ov-file#readme
- En la landing cuando comparto un link a una seccion al entrar se va de nuevo a overview siempre. Deberia ir a la seccion que está en la url, y no sobreescribir con overview siempre. A overview debe ir cuando no hay definido nada en la url.
- Un script que genere el bloque de tools automaticamente en la landing, que se apoye en el fichero SCHEMA y lo que necesite mas. Tal vez las definiciones de las tools debe estár en algun fichero, y que desde ahi se pueda generar el fichero de schemas y el bloque de tools de la landing y llms full.

------

BLOQUE MARKET

- Nomenclatura en tools:
    market_get_ticker -> market_get_data
    market_get_currency_rate -> market_get_ticker


- En tool market_get_ticker el campo currency, si que deberia llamarse currency.

- market_get_data deberia en la respuesta cambiarse quote_currency por currency.

-x market_get_assets network no puede ser en mayusculas, en otras tools de nuevos MCP no lo ponemos así

-x El tool market_get_asset y market_get_asset_details puede ser el mismo. Solo que permitiendo filtrar por un id. El tool puede llamarse market_get_assets_details

FALTA
- portfolio_get_valuation
-x wallet
- pro

- xLos esquemas de las respuestas no veo que estén explicados. No solo la explicacion si no los posibles parametros que pueden haber en la respuesta. Deberías apalancarte en la documentación que hay en los ficheros swagger para obtener la información que necesites.

-----

IMPLEMENTAR CON BIT2ME
- La cookie de jwt se podria usar
- La cookie no viaje en un websocket parece ser
- Habrá que encargarse de hacer el refresh. Solo el backend
- La instancia deberá ser para cada usuario, posiblemente no es necesario y puede pasarse el jwt en la llamada
- En el frontend hay que indicar que mande las cookies al backend, algo asi como credentials:true
- Actualmente Auth es quien valida el JWT si es correcto. Hay que validar el JWT.
- El frontend si estoy en el dominio de bit2me, debe llamar al back como bit2me. Lo de etc/hosts
- Desde el navegador puedo
- En el MCP tengo que poder configurar si quiero QA o PROD, pero no se si pasarla por dominio


Asset -> Para cripto
  - Symbol -> BTC
  - Name -> Bitcoin
Currency -> Para fiat, dinero tradicional
  - Symbol -> EUR
  - Name -> Euro

Price -> indica el precio en fiat

Qty -> Indica la cantidad, ¿mejor amount?


----

Wallet proforma tal vez es mejor separar las tools en vez de tener un metodo dios que hace muchas cosas. Muy complicado de entender.

----

PACO
- Mario revisión salarial
- Raul Simarro -> Ultimatum y si no despedir, buscar perfil de peru sustituto mismo coste mas experiencia

PABLO CAMPOS
- Revisar salario de pablo garcia



-------

