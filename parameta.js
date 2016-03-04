/*:
	@module-license:
		The MIT License (MIT)

		Copyright (c) 2015 Richeve Siodina Bebedor

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.
	@end-module-license

	@module-configuration:
		{
			"packageName": "parameta",
			"path": "parameta/parameta.js",
			"fileName": "parameta.js",
			"moduleName": "parameta",
			"authorName": "Richeve S. Bebedor",
			"authorEMail": "richeve.bebedor@gmail.com",
			"repository": "git@github.com:volkovasystems/parameta.git"
		}
	@end-module-configuration

	@module-documentation:
		This project is taken from the parser I created for object command format.

		To make the term "object command format" shorter we can alias it as "meta".

		Ideally, I would like to make "idea" in it its metaphysical 
			entity achieve physical function. 

		Therefore, a meta is a form with a function.

		But a meta cannot be like this so it can be called a "parameta".

		The function accepts a string block that contains meta data, then
			extracts it and return the meta data as functional objects.

		It always return an array because we should always assume a string block may contain
			more meta that we can expect.

		Each array contains a command and parameter.

		Unlike, the previous function, this function let's you try to execute the meta.
	@end-module-documentation

	@include:
	@end-include
*/

if( !( typeof window != "undefined" &&
	"harden" in window ) )
{
	var harden = require( "harden" );
}

if( typeof window != "undefined" && 
	!( "harden" in window ) )
{
	throw new Error( "harden is not defined" ); 
}



var parameta = function parameta( meta ){
	/*:
		@meta-configuration:
			{
				"meta:required": "string"
			}
		@end-meta-configuration
	*/

	//: This will separate and extract the object command format tokens.
	var matchList = meta.match( parameta.GREEDY_PATTERN ) || [ ];

	var matchListLength = matchList.length;
	if( matchList === null || matchListLength == 0 ){
		console.warn( "data does not contain any object command formats that can be parsed" );
		console.warn( "parameta will not do anything further" );

		return [ ];
	}

	//: This will remove excess tokens that is not needed.
	matchList = matchList.join( "[\n]" ).replace( /\t/g, "" ).split( "[\n]" );

	//: We need to traverse each object command data to parse JSON data parameters.
	var objectCommandList = [ ];

	var objectCommandData;
	for( var index = 0; index < matchListLength; index++ ){
		//: Remove excess spaces at both ends.
		objectCommandData = matchList[ index ].trim( );

		//: Extract parameter data and command.
		objectCommandData = objectCommandData.match( parameta.PATTERN );

		//: This is the only hack I can think to separate JSON format strings.
		var parameterData = objectCommandData[ 2 ];
		try{
			parameterData = JSON.parse( parameterData );

		}catch( error ){
			console.warn( "generated an error when parsing an assumed standard JSON data" );
			
			//: Remove excess whitespaces for non-JSON strings.
			parameterData = parameterData.replace( /^\s+/gm, "" );
		}

		objectCommandList.push( {
			"command": objectCommandData[ 1 ],
			"parameter": parameterData
		} );
	}

	return objectCommandList;
};

harden.bind( parameta )
	( "GREEDY_PATTERN",
		new RegExp( [ 
			"(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:)\s*",
			"([^\b]+?)",
			"\s*(?:\@end\-(?:\1|command))"
		].join( "" ) ), "gm" );

harden.bind( parameta )
	( "PATTERN",
		new RegExp( [ "(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:)\s*",
			"([^\b]+?)",
			"\s*(?:\@end\-(?:\1|command))"
		].join( "" ) ) );

if( typeof module != "undefined" ){ 
	module.exports = parameta; 
}

if( typeof global != "undefined" ){
	harden
		.bind( parameta )( "globalize", 
			function globalize( ){
				harden.bind( global )( "parameta", parameta );
			} );
}
