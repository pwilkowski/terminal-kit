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



const termkit = require( './termkit.js' ) ;



/**
 * @typedef RectProperties
 * @property {number} [xmin]
 * @property {number} [ymin]
 * @property {number} [xmax]
 * @property {number} [ymax]
 */

/**
 * @typedef RectSize
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * Rect: rectangular region, clipping, iterators for blitters, etc...
 *
 * @class
 * @param {number|RectProperties|Terminal|ScreenBuffer|TextBuffer|Rect} xmin
 * @param {number} [ymin]
 * @param {number} [xmax]
 * @param {number} [ymax]
 * @constructor
 */
function Rect( xmin , ymin , xmax , ymax ) {
	var src = xmin ;

	this.xmin = 0 ;
	this.xmax = 0 ;
	this.ymin = 0 ;
	this.ymax = 0 ;
	this.width = 0 ;
	this.height = 0 ;
	this.isNull = true ;

	if ( src && ( typeof src === 'object' || typeof src === 'function' ) ) {
		if ( src instanceof termkit.Terminal ) {
			this.set( {
				xmin: 1 ,
				ymin: 1 ,
				xmax: src.width ,
				ymax: src.height
			} ) ;
		}
		else if ( src instanceof termkit.ScreenBuffer ) {
			this.set( {
				xmin: 0 ,
				ymin: 0 ,
				xmax: src.width - 1 ,
				ymax: src.height - 1
			} ) ;
		}
		else if ( src instanceof termkit.TextBuffer ) {
			this.set( {
				xmin: 0 ,
				ymin: 0 ,
				xmax: src.width - 1 ,
				ymax: src.height - 1
			} ) ;
		}
		else if ( src instanceof Rect ) {
			this.set( src ) ;
		}
		else if ( src.xmin !== undefined || src.ymin !== undefined || src.xmax !== undefined || src.ymax !== undefined ) {
			this.set( {
				xmin: src.xmin !== undefined ? src.xmin : 0 ,
				ymin: src.ymin !== undefined ? src.ymin : 0 ,
				xmax: src.xmax !== undefined ? src.xmax : 1 ,
				ymax: src.ymax !== undefined ? src.ymax : 1
			} ) ;
		}
		else if ( src.x !== undefined || src.y !== undefined || src.width !== undefined || src.height !== undefined ) {
			this.set( {
				xmin: src.x !== undefined ? src.x : 0 ,
				ymin: src.y !== undefined ? src.y : 0 ,
				xmax: src.width !== undefined ? src.x + src.width - 1 : 1 ,
				ymax: src.height !== undefined ? src.y + src.height - 1 : 1
			} ) ;
		}
	}
	else {
		this.set( {
			xmin: xmin !== undefined ? xmin : 0 ,
			ymin: ymin !== undefined ? ymin : 0 ,
			xmax: xmax !== undefined ? xmax : 1 ,
			ymax: ymax !== undefined ? ymax : 1
		} ) ;
	}
}

module.exports = Rect ;



/**
 * Backward compatibility
 *
 * @name Rect#create
 * @static
 *
 * @param args
 * @returns {Rect}
 */
Rect.create = ( ... args ) => new Rect( ... args ) ;


/**
 * @name Rect#set
 * @param {RectProperties} data
 */
Rect.prototype.set = function( data ) {
	if ( data.xmin !== undefined ) { this.xmin = Math.floor( data.xmin ) ; }
	if ( data.xmax !== undefined ) { this.xmax = Math.floor( data.xmax ) ; }
	if ( data.ymin !== undefined ) { this.ymin = Math.floor( data.ymin ) ; }
	if ( data.ymax !== undefined ) { this.ymax = Math.floor( data.ymax ) ; }

	this.width = this.xmax - this.xmin + 1 ;
	this.height = this.ymax - this.ymin + 1 ;
	this.isNull = this.xmin > this.xmax || this.ymin > this.ymax ;
} ;



/**
 * Set the reset size, keeping *min and adjusting *max
 *
 * @name Rect#setSize
 * @param {RectSize} data
 */
Rect.prototype.setSize = function( data ) {
	if ( data.width !== undefined ) {
		this.width = Math.floor( data.width ) ;
		this.xmax = this.xmin + this.width - 1 ;
	}

	if ( data.height !== undefined ) {
		this.height = Math.floor( data.height ) ;
		this.ymax = this.ymin + this.height - 1 ;
	}

	this.isNull = this.xmin > this.xmax || this.ymin > this.ymax ;
} ;


/**
 * @name Rect#isInside
 *
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
Rect.prototype.isInside = function( x , y ) {
	return x >= this.xmin && x <= this.xmax && y >= this.ymin && y <= this.ymax ;
} ;



/**
 * Clip the src according to the dst, offset* are offsets of the srcRect relative to the dst coordinate system
 * @name Rect#clip
 *
 * @param {Rect} dstRect
 * @param {number} [offsetX]
 * @param {number} [offsetY]
 * @param {boolean} [dstClipping]
 * @returns {Rect}
 */
Rect.prototype.clip = function( dstRect , offsetX , offsetY , dstClipping ) {
	var srcRect = this ;

	offsetX = offsetX || 0 ;
	offsetY = offsetY || 0 ;

	srcRect.set( {
		xmin: Math.max( srcRect.xmin , dstRect.xmin - offsetX ) ,
		ymin: Math.max( srcRect.ymin , dstRect.ymin - offsetY ) ,
		xmax: Math.min( srcRect.xmax , dstRect.xmax - offsetX ) ,
		ymax: Math.min( srcRect.ymax , dstRect.ymax - offsetY )
	} ) ;

	if ( dstClipping ) {
		dstRect.set( {
			xmin: Math.max( dstRect.xmin , srcRect.xmin + offsetX ) ,
			ymin: Math.max( dstRect.ymin , srcRect.ymin + offsetY ) ,
			xmax: Math.min( dstRect.xmax , srcRect.xmax + offsetX ) ,
			ymax: Math.min( dstRect.ymax , srcRect.ymax + offsetY )
		} ) ;
	}

	return this ;
} ;



/**
 * Merge with another Rect, enlarge the current Rect so that it includes the Rect argument
 * @name Rect#merge
 *
 * @param {Rect} [rect]
 * @returns {Rect}
 */
Rect.prototype.merge = function( rect ) {
	this.set( {
		xmin: Math.min( this.xmin , rect.xmin ) ,
		ymin: Math.min( this.ymin , rect.ymin ) ,
		xmax: Math.max( this.xmax , rect.xmax ) ,
		ymax: Math.max( this.ymax , rect.ymax )
	} ) ;

	return this ;
} ;

/**
 * @typedef {Object} RectRegion
 * @property {Rect} dstRect
 * @property {Rect} srcRect
 * @property {number} offsetX
 * @property {number} offsetY
 */


/**
 * @typedef {Object} RectWrappingParams
 * @property {Rect} dstRect
 * @property {Rect} srcRect
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {'x'|'y'} [wrapOnly] - only wrap along that axis
 */


/**
 * Given a srcRect, a dstRect, offsetX and offsetY, return an array of up to 4 objects consisting of the same properties
 * found in entry, wrapping the src into the dst, i.e. the src is always fully visible in the dst, it is just as if
 * the dst where circular
 *
 * @name Rect#wrappingRect
 * @static
 *
 * @param {RectWrappingParams} p
 * @returns {RectRegion[]}
 */
Rect.wrappingRect = function( p ) {
	var regions = [] , nw , ne , sw , se ;


	// Originate, North-West region
	nw = {
		srcRect: new Rect( p.srcRect ) ,
		dstRect: new Rect( p.dstRect ) ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY
	} ;

	// Modulate offsets so they are in-range
	if ( p.wrapOnly !== 'y' ) {
		nw.offsetX = nw.offsetX % p.dstRect.width ;
		if ( nw.offsetX < 0 ) { nw.offsetX += p.dstRect.width ; }
	}

	if ( p.wrapOnly !== 'x' ) {
		nw.offsetY = nw.offsetY % p.dstRect.height ;
		if ( nw.offsetY < 0 ) { nw.offsetY += p.dstRect.height ; }
	}

	// Mutual clipping
	nw.srcRect.clip( nw.dstRect , nw.offsetX , nw.offsetY , true ) ;
	if ( ! nw.srcRect.isNull ) { regions.push( nw ) ; }

	// Wrap-x North-Est region
	if ( nw.srcRect.width < p.srcRect.width && p.wrapOnly !== 'y' ) {
		ne = {
			srcRect: new Rect( p.srcRect ) ,
			dstRect: new Rect( p.dstRect ) ,
			offsetX: nw.offsetX - p.dstRect.width ,
			offsetY: nw.offsetY
		} ;

		// Mutual clipping
		ne.srcRect.clip( ne.dstRect , ne.offsetX , ne.offsetY , true ) ;
		if ( ! ne.srcRect.isNull ) { regions.push( ne ) ; }
	}


	// Wrap-y South-West region
	if ( nw.srcRect.height < p.srcRect.height && p.wrapOnly !== 'x' ) {
		sw = {
			srcRect: new Rect( p.srcRect ) ,
			dstRect: new Rect( p.dstRect ) ,
			offsetX: nw.offsetX ,
			offsetY: nw.offsetY - p.dstRect.height
		} ;

		// Mutual clipping
		sw.srcRect.clip( sw.dstRect , sw.offsetX , sw.offsetY , true ) ;
		if ( ! sw.srcRect.isNull ) { regions.push( sw ) ; }
	}


	// Wrap-x + wrap-y South-Est region, do it only if it has wrapped already
	if ( ne && sw ) {
		se = {
			srcRect: new Rect( p.srcRect ) ,
			dstRect: new Rect( p.dstRect ) ,
			offsetX: nw.offsetX - p.dstRect.width ,
			offsetY: nw.offsetY - p.dstRect.height
		} ;

		// Mutual clipping
		se.srcRect.clip( se.dstRect , se.offsetX , se.offsetY , true ) ;
		if ( ! se.srcRect.isNull ) { regions.push( se ) ; }
	}

	return regions ;
} ;



/*
	This iterator generate synchronous line or cell for dst & src Rect.
	It is totally buffer agnostic.
	Buffer specificities should be added in p.context by the callee.

	Iterator.
	Mandatory params:
		* dstRect: Rect describing the dst geometry
		* srcRect: Rect describing the src geometry
		* type: 'line' or 'cell'
	Optionnal params:
		* context: an object that will be transmitted as is to the iterator
		* dstClipRect: a clipping Rect for the dst
		* srcClipRect: a clipping Rect for the src
		* offsetX: the X-offset of the origin of the srcRect relative to the dst coordinate system
		* offsetY: the Y-offset of the origin of the srcRect relative to the dst coordinate system
		* multiply: the byte size of a cell by which all offset should be multiplied
*/

/**
 * @typedef {Object} RectRegionIteratorParams
 * @property {Rect} dstRect - Rect describing the dst geometry
 * @property {Rect} srcRect - Rect describing the src geometry
 * @property {'line'|'cell'} type - 'line' or 'cell'
 * @property {*} [context] - an object that will be transmitted as is to the iterator
 * @property {Rect} [dstClipRect] - a clipping Rect for the dst
 * @property {Rect} [srcClipRect] - a clipping Rect for the src
 * @property {number} [offsetX] - the X-offset of the origin of the srcRect relative to the dst coordinate system
 * @property {number} [offsetY] - the Y-offset of the origin of the srcRect relative to the dst coordinate system
 * @property {number} [multiply] - the byte size of a cell by which all offset should be multiplied
 */

/**
 * @typedef RectRegionIteratorCallbackParams
 * @property {*} context
 * @property {number} srcX
 * @property {number} [srcXmin]
 * @property {number} [srcXmax]
 * @property {number} srcY
 * @property {number} srcStart
 * @property {number} srcEnd
 * @property {number} dstX
 * @property {number} [dstXmin]
 * @property {number} [dstXmax]
 * @property {number} dstY
 * @property {number} dstStart
 * @property {number} dstEnd
 * @property {boolean} [startOfBlitLine]
 * @property {boolean} [endOfBlitLine]
 */

/**
 * @callback RectRegionIterator
 * @param {RectRegionIteratorCallbackParams} p
 * @return {void|boolean}
 */

/**
 * This iterator generate synchronous line or cell for dst & src Rect.
 * It is totally buffer agnostic.
 * Buffer specificities should be added in p.context by the callee.
 *
 * @name Rect#regionIterator
 * @static
 *
 * @param {RectRegionIteratorParams} p
 * @param {RectRegionIterator} iterator
 */
Rect.regionIterator = function( p , iterator ) {
	var i , j , srcX , srcY , dstX , dstY , srcStart , dstStart , isFullWidth ;

	if ( ! p.multiply ) { p.multiply = 1 ; }
	if ( ! p.offsetX ) { p.offsetX = 0 ; }
	if ( ! p.offsetY ) { p.offsetY = 0 ; }

	if ( p.dstClipRect ) { p.dstClipRect.clip( p.dstRect ) ; }
	else { p.dstClipRect = new Rect( p.dstRect ) ; }

	if ( p.srcClipRect ) { p.srcClipRect.clip( p.srcRect ) ; }
	else { p.srcClipRect = new Rect( p.srcRect ) ; }

	// Mutual clipping
	p.srcClipRect.clip( p.dstClipRect , p.offsetX , p.offsetY , true ) ;

	// If out of bounds, or if everything is clipped away, return now
	if ( p.dstRect.isNull || p.srcClipRect.isNull || p.dstClipRect.isNull ) { return ; }

	switch ( p.type ) {
		case 'line' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ ) {
				srcY = p.srcClipRect.ymin + j ;
				dstY = p.dstClipRect.ymin + j ;

				iterator( {
					context: p.context ,
					srcXmin: p.srcClipRect.xmin ,
					srcXmax: p.srcClipRect.xmax ,
					srcY: srcY ,
					srcStart: ( srcY * p.srcRect.width + p.srcClipRect.xmin ) * p.multiply ,
					srcEnd: ( srcY * p.srcRect.width + p.srcClipRect.xmax + 1 ) * p.multiply ,
					dstXmin: p.dstClipRect.xmin ,
					dstXmax: p.dstClipRect.xmax ,
					dstY: dstY ,
					dstStart: ( dstY * p.dstRect.width + p.dstClipRect.xmin ) * p.multiply ,
					dstEnd: ( dstY * p.dstRect.width + p.dstClipRect.xmax + 1 ) * p.multiply
					//, lastLine: j === p.srcClipRect.height - 1
				} ) ;
			}
			break ;

		case 'reversedLine' :
			// Same than 'line' but start from the last line.
			// Useful for copying overlapping region of the same buffer, when the src rect has a lower Y-offset than the dst rect.
			for ( j = p.srcClipRect.height - 1 ; j >= 0 ; j -- ) {
				srcY = p.srcClipRect.ymin + j ;
				dstY = p.dstClipRect.ymin + j ;

				iterator( {
					context: p.context ,
					srcXmin: p.srcClipRect.xmin ,
					srcXmax: p.srcClipRect.xmax ,
					srcY: srcY ,
					srcStart: ( srcY * p.srcRect.width + p.srcClipRect.xmin ) * p.multiply ,
					srcEnd: ( srcY * p.srcRect.width + p.srcClipRect.xmax + 1 ) * p.multiply ,
					dstXmin: p.dstClipRect.xmin ,
					dstXmax: p.dstClipRect.xmax ,
					dstY: dstY ,
					dstStart: ( dstY * p.dstRect.width + p.dstClipRect.xmin ) * p.multiply ,
					dstEnd: ( dstY * p.dstRect.width + p.dstClipRect.xmax + 1 ) * p.multiply
				} ) ;
			}
			break ;

		case 'cell' :
			for ( j = 0 ; j < p.srcClipRect.height ; j ++ ) {
				for ( i = 0 ; i < p.srcClipRect.width ; i ++ ) {
					srcX = p.srcClipRect.xmin + i ;
					srcY = p.srcClipRect.ymin + j ;

					dstX = p.dstClipRect.xmin + i ;
					dstY = p.dstClipRect.ymin + j ;

					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;

					isFullWidth = iterator( {
						context: p.context ,
						srcX: srcX ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstX: dstX ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply ,
						startOfBlitLine: ! i ,
						endOfBlitLine: i === p.srcClipRect.width - 1
					} ) ;

					if ( isFullWidth ) { i ++ ; }
				}
			}
			break ;
	}
} ;


/**
 * @typedef {Object} RectTileIteratorCallbackParams
 * @param {*} context - an object that will be transmitted as is to the iterator
 * @param {number} srcX
 * @param {number} [srcXmin]
 * @param {number} [srcXmax]
 * @param {number} srcY
 * @param {number} srcStart
 * @param {number} srcEnd
 * @param {number} dstX
 * @param {number} [dstXmin]
 * @param {number} [dstXmax]
 * @param {number} dstY
 * @param {number} dstStart
 * @param {number} dstEnd
 */

/**
 * @callback RectTileIterator
 * @param {RectTileIteratorCallbackParams} p
 */

/**
 * @typedef {Object} RectTileIteratorParams
 * @property {Rect} dstRect
 * @property {Rect} srcRect
 * @property {'line'|'cell'} type
 * @property {*} [context] - an object that will be transmitted as is to the iterator
 * @property {number} [dstClipRect]
 * @property {number} [srcClipRect]
 * @property {number} [offsetX]
 * @property {number} [offsetY]
 * @property {number} [multiply]
 */

/**
 * This is the tile-variant of the regionIterator.
 *
 * @name Rect#tileIterator
 * @static
 *
 * @param {RectTileIteratorParams} p
 * @param {RectTileIterator} iterator
 */
Rect.tileIterator = function( p , iterator ) {
	var srcI , srcJ , srcX , srcY , dstI , dstJ , dstX , dstY , streak , srcStart , dstStart ;

	if ( ! p.multiply ) { p.multiply = 1 ; }
	if ( ! p.offsetX ) { p.offsetX = 0 ; }
	if ( ! p.offsetY ) { p.offsetY = 0 ; }

	if ( p.dstClipRect ) { p.dstClipRect.clip( p.dstRect ) ; }
	else { p.dstClipRect = new Rect( p.dstRect ) ; }

	if ( p.srcClipRect ) { p.srcClipRect.clip( p.srcRect ) ; }
	else { p.srcClipRect = new Rect( p.srcRect ) ; }


	switch ( p.type ) {
		case 'cell' :
			for ( dstJ = 0 ; dstJ < p.dstClipRect.height ; dstJ ++ ) {
				srcJ = ( dstJ - p.offsetY ) % p.srcClipRect.height ;
				if ( srcJ < 0 ) { srcJ += p.srcClipRect.height ; }

				for ( dstI = 0 ; dstI < p.dstClipRect.width ; dstI ++ ) {
					srcI = ( dstI - p.offsetX ) % p.srcClipRect.width ;
					if ( srcI < 0 ) { srcI += p.srcClipRect.width ; }

					srcX = p.srcClipRect.xmin + srcI ;
					srcY = p.srcClipRect.ymin + srcJ ;

					dstX = p.dstClipRect.xmin + dstI ;
					dstY = p.dstClipRect.ymin + dstJ ;

					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;

					iterator( {
						context: p.context ,
						srcX: srcX ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + p.multiply ,
						dstX: dstX ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + p.multiply
					} ) ;
				}
			}
			break ;

		case 'line' :
			for ( dstJ = 0 ; dstJ < p.dstClipRect.height ; dstJ ++ ) {
				srcJ = ( dstJ - p.offsetY ) % p.srcClipRect.height ;
				if ( srcJ < 0 ) { srcJ += p.srcClipRect.height ; }

				dstI = 0 ;
				while ( dstI < p.dstClipRect.width ) {
					srcI = ( dstI - p.offsetX ) % p.srcClipRect.width ;
					if ( srcI < 0 ) { srcI += p.srcClipRect.width ; }

					streak = Math.min( p.srcClipRect.width - srcI , p.dstClipRect.width - dstI ) ;

					srcX = p.srcClipRect.xmin + srcI ;
					srcY = p.srcClipRect.ymin + srcJ ;

					dstX = p.dstClipRect.xmin + dstI ;
					dstY = p.dstClipRect.ymin + dstJ ;

					srcStart = ( srcY * p.srcRect.width + srcX ) * p.multiply ;
					dstStart = ( dstY * p.dstRect.width + dstX ) * p.multiply ;

					iterator( {
						context: p.context ,
						srcXmin: srcX ,
						srcXmax: srcX + streak - 1 ,
						srcY: srcY ,
						srcStart: srcStart ,
						srcEnd: srcStart + streak * p.multiply ,
						dstXmin: dstX ,
						dstXmax: dstX + streak - 1 ,
						dstY: dstY ,
						dstStart: dstStart ,
						dstEnd: dstStart + streak * p.multiply
					} ) ;

					dstI += streak ;
				}
			}
			break ;
	}
} ;


/**
 * @typedef {Object} RectWrapIteratorParams
 * @property {Rect} dstRect
 * @property {Rect} srcRect
 * @property {'line'|'cell'} type
 * @property {*} [context] - an object that will be transmitted as is to the iterator
 * @property {number} [dstClipRect]
 * @property {number} [srcClipRect]
 * @property {number} [offsetX]
 * @property {number} [offsetY]
 * @property {number} [multiply]
 * @property {'x'|'y'} [wrapOnly] - only wrap along that axis
 */

/**
 * This is the wrap-variant of the regionIterator.
 *
 * @name Rect#wrapIterator
 * @static
 *
 * @param {RectWrapIteratorParams} p
 * @param {RectRegionIterator} iterator
 */
Rect.wrapIterator = function( p , iterator ) {
	var i , regions ;

	regions = Rect.wrappingRect( {
		dstRect: p.dstClipRect ,
		srcRect: p.srcClipRect ,
		offsetX: p.offsetX ,
		offsetY: p.offsetY ,
		wrapOnly: p.wrap
	} ) ;

	for ( i = 0 ; i < regions.length ; i ++ ) {
		p.dstClipRect = regions[ i ].dstRect ;
		p.srcClipRect = regions[ i ].srcRect ;
		p.offsetX = regions[ i ].offsetX ;
		p.offsetY = regions[ i ].offsetY ;

		Rect.regionIterator( p , iterator ) ;
	}
} ;

