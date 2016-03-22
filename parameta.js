"use strict";

/*:
	@module-license:
		The MIT License (MIT)

		Copyright (@c) 2015 Richeve Siodina Bebedor
		@email: richeve.bebedor@gmail.com

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

		The meta can be inside a comment.

		Both common comment blocks and syntax is supported as well as html comments.

		The goal of this function is to transform any blocks before it will be executed.
	@end-module-documentation

	@include:
	@end-include
*/

if( !( typeof window != "undefined" &&
	"harden" in window ) )
{
	var harden = require( "harden" );
}

if( !( typeof window != "undefined" &&
	"llamalize" in window ) )
{
	var llamalize = require( "llamalize" );
}

if( !( typeof window != "undefined" &&
	"regxr" in window ) )
{
	var regxr = require( "regxr" );
}

if( !( typeof window != "undefined" &&
	"vincio" in window ) )
{
	var vincio = require( "vincio" );
}

if( typeof window != "undefined" && 
	!( "harden" in window ) )
{
	throw new Error( "harden is not defined" ); 
}

if( typeof window != "undefined" && 
	!( "llamalize" in window ) )
{
	throw new Error( "llamalize is not defined" ); 
}

if( typeof window != "undefined" && 
	!( "regxr" in window ) )
{
	throw new Error( "regxr is not defined" ); 
}

if( typeof window != "undefined" && 
	!( "vincio" in window ) )
{
	throw new Error( "vincio is not defined" ); 
}

var Meta = function Meta( meta ){
	/*:
		A meta can be a group of meta so we just need to delegate them.
	*/
	if( Array.isArray( meta ) ){
		var groupLength = meta.length;

		/*:
			This will categorize the meta as a group of meta
				although these meta are either dependent or independent
				they will still be considered a conglomerate.
		*/
		var group = meta;

		var nameList = [ ];

		for( var index = 0; index < groupLength; index++ ){
			var _meta = group[ index ];

			if( Array.isArray( group[ _meta.meta.name ] ) ){
				group[ _meta.meta.name ].push( _meta );

			}else if( group[ _meta.meta.name ] instanceof Meta ){
				group[ _meta.meta.name ] = [ group[ _meta.meta.name ], _meta ];
			
			}else{
				group[ _meta.meta.name ] = _meta;

				nameList.push( _meta.meta.name );
			}
		}

		/*:
			Sub group of meta will be appended with $index.
		*/
		var nameListLength = nameList.length;
		for( var index = 0; index < nameListLength; index++ ){
			var name = nameList[ index ];

			if( Array.isArray( group[ name ] ) ){
				group[ name ]
					.forEach( function onEachSubGroup( meta, index ){
						group[ name ][ "$" + index ] = meta;
					} );
			}
		};

		return group;

	}else if( this instanceof Meta ){
		this.meta = meta;

		this.raw = meta.raw;

		this.matcher = meta.matcher;
		this.content = meta.content;

		var name = llamalize( this.meta.command );

		this.meta.name = name

		try{
			if( require.resolve( this.meta.command ) ){
				this.meta[ name ] =	require( this.meta.command );
			}

		}catch( error ){
			console.error( "command", this.meta.command, "is not installed" );

			var self = this;
			this.meta[ name ] = function( ){
				try{
					if( require.resolve( self.meta.command ) ){
						return require( self.meta.command ).apply( this, arguments );
					}

				}catch( error ){
					console.error( "command", self.meta.command, "is not installed" );

					//: Just return the parameter if there are no catching methods.
					return self.meta.parameter;
				}
			};
		}

		//: This will pre-consume the data.
		vincio( this, "then" )
			.get( function then( ){
				var raw = this._raw;
				delete this._raw;
				
				var parameter = this._parameter;
				delete this._parameter;

				var name = this._name;
				delete this._name;

				var meta = parameta( this.raw );
				if( raw ){
					meta = parameta( raw );
				}

				meta[ name ].meta.parameter = parameter;

				//: Return a new meta.
				return meta[ name ];	
			} );

	}else{
		return new Meta( meta );
	}
};


/*:
	@method-documentation:
		This will execute the parameter once and disregard chained meta.
	@end-method-documentation
*/
Meta.prototype.execute = function execute( parameter ){
	return this.meta[ this.meta.name ]( parameter || this.meta.parameter );
};

/*:
	@method-documentation:
		This will execute the parameter by chaining.
	@end-method-documentation
*/
Meta.prototype.chain = function chain( parameter, options ){
	options = options || { };

	if( ( parameta.BLOCK_PATTERN.test( this.meta.parameter ) ||
			parameta.LINE_PATTERN.test( this.meta.parameter ) ) &&
		options.track != this.meta.name )
	{
		options.track = this.meta.name;

		var metaStack = [ ];

		var current = this;

		while( parameta.BLOCK_PATTERN.test( current.meta.parameter ) ||
			parameta.LINE_PATTERN.test( current.meta.parameter ) )
		{
			metaStack.push( current );

			current = parameta( current.meta.parameter )[ 0 ];
		}

		metaStack.push( current );

		metaStack = metaStack.reverse( );

		var result = current.meta.parameter;

		do{
			result = metaStack.pop( ).chain( result, options );
		
		}while( metaStack.length );

		return result;
	
	}else{
		return this.execute( parameter );
	}
};

/*:
	@method-documentation:
		This will change the content of the meta block
			based on the given content.

		This is a transition method.

		The content can be a json, string or another meta.
	@end-method-documentation
*/
Meta.prototype.change = function change( content ){
	if( content instanceof Meta ){
		var _meta = content;

		this._raw = this.raw.replace( this.matcher, _meta.matcher );

		this._name = _meta.meta.name;

		return this;
	
	}else if( typeof content == "object" ){
		this._parameter = content;

		this._name = this.meta.name;
	
	}else if( typeof content == "string" ){
		this._raw = this.raw.replace( this.content, content );

		this._parameter = content;

		this._name = this.meta.name;
	}

	return this;
};

/*:
	@method-documentation:
		This will clear the content of the meta block.

		This is a transition method.
	@end-method-documentation
*/
Meta.prototype.clear = function clear( ){
	return this.change( "" );
};

/*:
	@method-documentation:
		This will remove the meta in the raw.

		This is a transition method.
	@end-method-documentation
*/
Meta.prototype.collapse = function collapse( ){
	this._raw = this.raw.replace( this.matcher, "" );

	this._name = _meta.meta.name;

	return this;
};

/*:
	@method-documentation:
		Returns the modified raw data because of
			the application of the meta.
	@end-method-documentation
*/
Meta.prototype.consume = function consume( ){
	return this.raw;
};

var parameta = function parameta( meta ){
	/*:
		@meta-configuration:
			{
				"meta:required": "string"
			}
		@end-meta-configuration
	*/

	var raw = meta;

	//: This will separate and extract the object command format tokens.
	var matchList = meta.match( parameta.GREEDY_BLOCK_PATTERN ) || [ ];
	var lineList = meta.match( parameta.GREEDY_LINE_PATTERN ) || [ ];

	var matchListLength = matchList.length;
	var lineListLength = lineList.length;
	if( matchListLength == 0 && 
		lineListLength == 0 )
	{
		return [ ];
	}

	//: This will remove excess tokens that is not needed.
	matchList = matchList.join( "[\n]" ).replace( /\t/g, "" ).split( "[\n]" );

	for( var index = 0; index < lineListLength; index++ ){
		matchList.push( lineList[ index ] );
	}

	matchListLength = matchList.length;

	//: We need to traverse each object command data to parse JSON data parameters.
	var objectCommandList = [ ];

	var objectCommandData;
	for( var index = 0; index < matchListLength; index++ ){
		//: Remove excess spaces at both ends.
		objectCommandData = matchList[ index ].trim( );
		var matcher = objectCommandData;


		//: Extract parameter data and command.
		if( parameta.BLOCK_PATTERN.test( objectCommandData ) ){
			objectCommandData = objectCommandData.match( parameta.BLOCK_PATTERN );

		}else{
			objectCommandData = objectCommandData.match( parameta.LINE_PATTERN );
		}

		//: This is the only hack I can think to separate JSON format strings.
		var parameterData = objectCommandData[ 2 ];
		var content = parameterData;
		try{
			parameterData = JSON.parse( parameterData );

		}catch( error ){
			//: Remove excess whitespaces for non-JSON strings.
			parameterData = parameterData.replace( /^\s+/gm, "" );
		}

		objectCommandList.push( {
			"raw": raw,
			"matcher": matcher,
			"content": content,
			"command": objectCommandData[ 1 ],
			/*:
				The parameter may contain a single parameter value or
					a set of parameter values but still
					they will be treated as one so this should stay singular.

				I hate plural variables. 
			*/
			"parameter": parameterData
		} );
	}

	return Meta( objectCommandList
		.map( function onEachObjectCommand( meta ){
			return Meta( meta );
		} ) );
};

harden.bind( parameta )
	( "GREEDY_BLOCK_PATTERN",
		regxr( 
			/(?:\<\!\-\-\:\s*)?/,
			/(?:(?:\/\/|\/\*)\:\s*)?/,
			/(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:)\s*/,
			/([^\b]+?)\s*/,
			/(?:\s*\/\/\:\s*)?/,
			/(?:\@end\-(?:\1|command))/,
			/(?:\s*\*\/\s*)?/,
			/(?:\s*\-\-\>\s*)?/, 
			"gm" 
		) );

harden.bind( parameta )
	( "GREEDY_LINE_PATTERN",
		regxr( 
			/(?:\<\!\-\-\:\s*)?/,
			/(?:\s*\/\/\:\s*)?/, 
			/(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:\:)\s*/,
			/([^\b]+?)\s*\;/,
			/(?:\s*\-\-\>\s*)?/, 
			"g" 
		) );

harden.bind( parameta )
	( "BLOCK_PATTERN",
		regxr( 
			/^/,
			//: Support for html comments.
			/(?:\<\!\-\-\:\s*)?/,
			//: Support for common block/line comments.
			/(?:(?:\/\/|\/\*)\:\s*)?/,
			/(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:)\s*/,
			/([^\b]+?)\s*/,
			/(?:\s*\/\/\:\s*)?/,
			/(?:\@end\-(?:\1|command))/,
			/(?:\s*\*\/\s*)?/,
			/(?:\s*\-\-\>\s*)?/,
			/$/
		) );

harden.bind( parameta )
	( "LINE_PATTERN",
		regxr(
			/^/, 
			/(?:\<\!\-\-\:\s*)?/,
			/(?:\s*\/\/\:\s*)?/,
			/(?:\@([a-z][a-z0-9]+(?:\-[a-z][a-z0-9]+)*)\:\:)\s*/,
			/([^\b]+?)\s*\;/,
			/(?:\s*\-\-\>\s*)?/,
			/$/
		) );

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