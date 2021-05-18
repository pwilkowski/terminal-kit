/*
	Terminal Kit

	Copyright (c) 2009 - 2021 Cédric Ronvel

	The MIT License (MIT)

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
*/

"use strict" ;



/*
	Ideally, this should be done using a graph algorithm, but we will just brute-force it for instance...
*/
/**
 * This static method is used behind the scene by
 * [.inputField()]{@link https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.inputField}
 * when auto-completion mechanisms kick in.
 *
 * This method is exposed in the API because
 * [.inputField()]{@link https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.inputField}
 * supports user-defined auto-completers, such auto-completers might take advantage of this method for its final
 * pass, after collecting relevant informations to feed it.
 *
 * [This is an example of its usage.]{@link https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.example.autoComplete}
 *
 * @param {string[]} array - Array of string, it is the list of completion candidates
 * @param {string} startString - string this is the input string to be completed
 * @param {boolean} [returnAlternatives=false] - when many candidates match the input, if returnAlternatives is set
 * then the method is allowed to return an array containing all matching candidates, else the input string
 * (startString) is returned unchanged
 * @param {string} [prefix=''] prepend that string to the response string, or add a prefix property to the response
 * array: when used in an inputField(), this cause this string to be prepended to the output of the auto-complete menu.
 * @param {string} [postfix=''] append that string to the response string, or add a postfix property to the response
 * array: when used in an inputField(), this cause this string to be appended to the output of the auto-complete menu.
 * @returns {string|*[]}
 */
module.exports = function autoComplete( array , startString , returnAlternatives , prefix , postfix ) {
	var i , j , exitLoop , candidate = [] , completed = startString , hasCompleted = false ;

	if ( ! prefix ) { prefix = '' ; }
	if ( ! postfix ) { postfix = '' ; }

	for ( i = 0 ; i < array.length ; i ++ ) {
		if ( array[ i ].slice( 0 , startString.length ) === startString ) { candidate.push( array[ i ] ) ; }
	}

	if ( ! candidate.length ) { return prefix + completed + postfix ; }

	if ( candidate.length === 1 ) { return prefix + candidate[ 0 ] + postfix ; }


	// Multiple candidate, complete only the part they have in common

	j = startString.length ;

	exitLoop = false ;

	for ( j = startString.length ; j < candidate[ 0 ].length ; j ++ ) {
		for ( i = 1 ; i < candidate.length ; i ++ ) {
			if ( candidate[ i ][ j ] !== candidate[ 0 ][ j ] ) { exitLoop = true ; break ; }
		}

		if ( exitLoop ) { break ; }

		completed += candidate[ 0 ][ j ] ;
		hasCompleted = true ;
	}

	if ( returnAlternatives && ! hasCompleted ) {
		candidate.prefix = prefix ;
		candidate.postfix = postfix ;
		return candidate ;
	}

	return prefix + completed + postfix ;
} ;

