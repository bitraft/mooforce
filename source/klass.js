/**
 * @auther Chang Long <changlon@gmail.com>
 * https://github.com/changloong/mooforce
 */

var Klass	= (function(){
	
    var Type   = (function() {
        var Type = function ( properties, prototype  ) {
            function type( self ) {
                this.self  = self ;
            }
            Type.implement(type, properties) ;
            Type.implement(type, {
                is: function(){
                    return this instanceof prototype ;
                }
            }) ;
            return type ;
        };

        Type.implement    = function(type, properties ) {
            Type.each.call(properties, function(property, name ) {
                if( !type.hasOwnProperty(name) ) this[name]  = function() {
                    return property.apply( arguments[0],  Array.prototype.slice.call(arguments, 1) ) ;
                } ;
                if( ! this.prototype.hasOwnProperty(name) ) {
                    this.prototype[name]    = property ;
                }
            }, type );
        };

        Type.chain    = function(type, properties ) {
            Type.each.call(properties, function(property, name, type ){
                if( !type.hasOwnProperty(name) ) this[name]  = function() {
                    return property.apply( arguments[0],  Array.prototype.slice.call(arguments, 1) ) ;
                } ;
                if( !type.prototype.hasOwnProperty(name) ) {
                    type.prototype[name]    = function(){
                        this.self = property.apply( this.self, arguments) ;
                        return this.self ;
                    } ;
                }
            }, type ) ;
        };

        Type.each   = function(fn, bind ){
            for(var p in this ) if( this.hasOwnProperty(p) ) {
                fn.call( bind || this , this[p], p , bind || this ) ;
            }
        };
        
        return Type ;
    })();

	var $fn	= (function(){
        var enumerables = true;
        for (var i in {toString: 1}) enumerables = null;
        if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

		var fn	= new Type({

        }, Function );

        Type.chain(fn, {
            proxy: function(obj) {
                var fn = this ;
                return function() {
                    return fn.apply(obj, arguments);
                };
            },
            parent: function( _parent ) {
                var _self = this ;
                return function(){
                        var current = this.$super ;
                        this.$super = _parent ;
                        var result  = _self.apply(this, arguments);
                        this.$super = current ;
                        return result ;
                    };
            }
        });

		return fn ;
	})();

	var $array = (function(){

		var array	= new Type({
            each: function(fn, bind) {
                for ( var i = 0; i < this.length; i++) {
                    fn.call(bind || this, this[i], i );
                }
            },
            some: function( fn, bind) {
                for ( var i = 0; i < this.length; i++) {
                    if( fn.call(bind || this, array[i], i ) ) {
                        return true ;
                    }
                }
            },
            every:  function( fn, bind) {
                for ( var i = 0; i < this.length; i++) {
                    if( ! fn.call(bind || this, this[i], i ) ) {
                        return false ;
                    }
                }
                return true ;
            },

            erase: function(item) {
                for ( var i = this.length; i--;) {
                    if ( this[i] === item)
                        this.splice(i, 1);
                }
                return this ;
            }
        }, Array );

        if ( Array.prototype.hasOwnProperty('indexOf') ) {
            Type.chain(array, {
                include: function(item){
                    if (-1 == this.indexOf(item))
                        this.push(item);
                    return this;
                }
            });
            Type.implement(array, {
                contains: function(item) {
                    return -1 != this.indexOf(item);
                }
            });
        } else {
            Type.chain(array, {
                include: function(item){
                    for ( var i = this.length; i--;) {
                        if (this[i] == item)
                            return this;
                    }
                    this.push(item);
                    return this;
                }
            });
            Type.implement({
                contains: function(item) {
                    for ( var i = this.length; i--;) {
                        if (this[i] == item)
                            return true;
                    }
                    return false;
                }
            });
        }

		return array ;
	})();
	
	var $object = (function() {
        var object	= new Type({
            is: function(){
                if( this instanceof Array ) {
                    return false ;
                }
                if( this instanceof Function ) {
                    return false ;
                }
                return 'object' === typeof this ;
            },
            each: Type.each,
            merge: function( source ){
                if( object.is(this) ) {
                    if( object.is( source ) ) {
                        for(var k in source ) if( source.hasOwnProperty(k) ) {
                            if( this.hasOwnProperty(k) ) {
                                this[k]   = arguments.callee.call( this[k], source[k] );
                            } else {
                                this[k]   = object.clone(source[k]) ;
                            }
                        }
                    }
                }
                return this ;
            },
            clone: function() {
                if (this instanceof Array) {
                    var len = this.length;
                    var _obj = new Array(len);
                    for ( var i = 0; i < len; i++) {
                        _obj[i] = arguments.callee.call(this[i]);
                    }
                    return _obj;
                } else if ( typeof this == 'object' ) {
                    var _obj = new Object;
                    for ( var i in this)  if ( this.hasOwnProperty(i) ) {
                        _obj[i] = arguments.callee.call(this[i]);
                    }
                    return _obj;
                }
                return this ;
            },
            reset: function(){
                for (var key in this) {
                    var value = this[key] ;
                    if (value instanceof Array) {
                        var len = value.length;
                        var _obj = new Array(len) ;
                        for ( var i = 0; i < len; i++) {
                            _obj[i] = arguments.callee.call(value[i]);
                        }
                        object[key] = _obj ;
                    } else if ( typeof value == 'object' ) {
                        var F = function(){} ;
                        F.prototype = value ;
                        this[key] = arguments.callee.call(new F);
                    }
                }
                return this ;
            }
        }, Object ) ;

		return object ;
	})();

    var Class = (function(){
        var classes = [] ;

        function Class(constructor, properties ){

            if ( properties.hasOwnProperty('extends') ) {
                this.parent = arguments.callee.find( properties['extends'] ) ;
                if( !this.parent ) {
                    throw new Error('extends is invalid');
                }
                delete properties['extends'] ;
            } else {
                this.parent = null ;
            }

            this.constructor    = constructor ;
            classes.push( this ) ;

            if ( properties.hasOwnProperty('initialize') ) {
                if( 'function' !== typeof  properties['initialize'] ) {
                    throw new Error('initialize method is not function') ;
                }
                if( this.parent && this.parent.initialize ) {
                    this.initialize = _fn.parent(properties['initialize'], this.parent.initialize) ;
                } else {
                    this.initialize = properties['initialize'] ;
                }
                delete properties['initialize'] ;
            } else {
                this.initialize = this.parent ? this.parent.initialize : null ;
            }

            this.binds   = {} ;
            this.implements = [ Class.Events, Class.Options ] ;
            this.constructor.prototype  = {} ;

            this.extends( properties ) ;
        };

        Class.find = function(constructor){
            var len = classes.length ;
            for ( var i = 0; i < len ; i++) {
                if( classes[i].constructor === constructor ) {
                    return classes[i] ;
                }
            }
            return null ;
        } ;

        Class.prototype.bind   = function( object, self ) {
            if( this.parent ) {
                this.parent.bind( object ) ;
            }

            $object.each( this.binds, function( fn, name ) {
                var parent = null ;
                if( object.hasOwnProperty(name) ) {
                    var parent  = object[ name ] ;
                } else if( self && this.constructor.prototype.hasOwnProperty(name) ) {
                    var parent  = this.constructor.prototype[ name ] ;
                    if( typeof parent !== 'function' ) {
                        parent = null ;
                    }
                }
                if( parent ) {
                    object[name]    = $fn.proxy( $fn.parent( fn, parent ) , object );
                } else {
                    object[name]    = $fn.proxy(fn, object ) ;
                }
            }, this ) ;
        };


        Class.prototype.extends   = function( properties ) {

            if( typeof properties !== 'object' ) {
                throw new Error('implements properties must be object');
            }

            if ( properties.hasOwnProperty('Binds') ) {
                if( ! $array.is(properties['Binds']) ) {
                    throw new Error('Binds must be array');
                }
                $array.each( properties['Binds'], function(p) {
                    if ( properties.hasOwnProperty(p) ) {
                        var fn  = properties[p] ;
                        delete properties[p];
                        if( 'function' !== typeof fn ) {
                            throw new Error('Binds method "' + p + '" is not function');
                        }
                        this.binds[p] = fn ;
                    } else {
                        throw new Error('Binds method "' + p + '" not exists');
                    }
                }, type ) ;
                delete properties['Binds'];
            }

            if ( properties.hasOwnProperty('implements') ) {
                if( properties['implements'] instanceof Array ) {
                    _array.each(properties['implements'], function(value) {
                        this.push(value) ;
                    }, this.implements) ;
                } else {
                    this.implements.push( properties['implements'] ) ;
                }
                delete properties['implements'] ;
            }

            if(  this.parent ) {
                _object.each(properties, function(value, name){
                    if( $fn.is(value) && this.hasOwnProperty(name) && $fn.is(this[name]) ) {
                        properties[name]  =  _fn.parent(value, this[name] ) ;
                    } else {
                        properties[name]  =  _object.clone(value);
                    }
                }, this.parent.constructor.prototype ) ;
            }

            this.constructor.prototype  = $object.merge( properties ,  this.parent ? this.parent.constructor.prototype : {} ) ;

        };


        Class.prototype.construct  = function (object, args ){
            $object.reset(object) ;

            this.bind(object, true ) ;

            var initialized = [] ;
            $array.each(this.implements, function( properties ){
                if( properties instanceof Function ) {
                    properties = properties.call( this ) ;
                }
                if( typeof properties !== 'object' ) {
                    throw new Error('implements "' + String( properties ) + '" is not object' );
                }

                if ( properties.hasOwnProperty('initialized') ) {
                    initialized.push( properties['initialized'] );
                    delete properties['initialized'] ;
                }
                if ( properties.hasOwnProperty('Binds') ) {
                    if( ! $array.is(properties['Binds']) ) {
                        throw new Error('Binds must be array');
                    }
                    _array.each( properties['Binds'], function(p) {
                        if ( properties.hasOwnProperty(p) ) {
                            var fn  = properties[p] ;
                            delete properties[p];
                            if( $fn.is(fn) ) {
                                this[p] = _fn.proxy( fn, this ) ;
                            } else {
                                throw new Error('Binds method "' + p + '" is not function');
                            }
                        } else {
                            throw new Error('Binds method "' + p + '" not exists');
                        }
                    }, object ) ;
                    delete properties['Binds'];
                }
                $object.merge(this, properties );
            }, object ) ;

            var self = this.initialize ? this.initialize.apply(object, args) : object ;

            $array.each(initialized, function(fn){
                fn.call(this) ;
            }, object ) ;

            initialized = null ;

            return self ;
        };


        return Class ;
    })() ;


    Class.Events  = function() {
        var events = {} ;
        return {
            addEvent: function(type, fn) {
                if (!(fn instanceof Function)) {
                    throw new Exception('add event need Function argument!');
                }
                events[type] = $array.include( events[type] || [], fn);
                return this;
            } ,
            fireEvent: fireEvent = function(type) {
                if ( events.hasOwnProperty(type) ) {
                    var _events = events[type];
                    for ( var i = 0; i < _events.length; i++) {
                        if( false === _events[i].apply(this, Array.prototype.slice.call(arguments, 1)) ) {
                            return false ;
                        }
                    }
                }
                return true ;
            } ,
            removeEvent: function(type, fn) {
                if ( events.hasOwnProperty(type) ) {
                    $array.erase( events[type], fn) ;
                }
                return this;
            } ,
            addEvents: function(events) {
                for ( var type in events)
                    if (events.hasOwnProperty(type)) {
                        this.addEvent(type, events[type]);
                    }
                return this;
            } ,
            removeEvents : function(type) {
                if (!(type instanceof String) ) {
                    for (_type in type)
                        if ( type.hasOwnProperty(_type)) {
                            this.removeEvent( _type, type[_type] ) ;
                        }
                    return this;
                }
                if ( events.hasOwnProperty(type) ) {
                    delete events[type] ;
                }
                return this;
            }
        };
    } ;


    Class.Options  = (function() {
        function $removeOn(string) {
            return string.replace(/^on([A-Z])/, function(full, first) {
                return first.toLowerCase();
            });
        };
        function $tryRemoveOn(string) {
            if ( /^on([A-Z]\w+)$/.test(string) ) {
                return String(RegExp.$1).toLowerCase();
            } else {
                return string;
            }
        } ;
        return function() {
            var options_initialized = true ;
            return {
                initialized: function() {
                    var fn  = options_initialized ;
                    options_initialized = null ;
                    if( $fn.is(fn) ) {
                        fn.call(this) ;
                    }
                } ,
                setOptions: function(options){
                    if (typeof options != 'object') {
                        throw new Error('options is not object') ;
                    }

                    var scope_initialized = null ;
                    if ( options.hasOwnProperty('initialized') ) {
                        if( $fn.is(options['initialized']) ) {
                            if ( options_initialized ) {
                                options_initialized  = options['initialized'] ;
                            } else {
                                scope_initialized  = options['initialized'] ;
                            }
                            delete options['initialized'];
                        }
                    }

                    this.options = _object.merge( options, this.options ) ;

                    $object.each( this.options, function(value, key ) {
                        if ( key == 'events') {
                            this.addEvents(value) ;
                            delete this.options[key] ;
                        } else {
                            var type = $tryRemoveOn(key);
                            if ( key != type && $fn.is(value) ) {
                                this.addEvent(type, value ) ;
                                delete this.options[key] ;
                            }
                        }
                    }, this ) ;
                    if ( scope_initialized ) {
                        scope_initialized.call(this) ;
                    }
                }
            };
        }
    })();


    var exports  = function ( properties ) {
        var klass    = new Class(constructor, properties) ;
        function constructor() {
            return klass.construct(this, arguments ) ;
        } ;
        return constructor ;
    } ;

    exports.extends    = function(constructor, properties ) {
        var klass    = Class.find( constructor ) ;
        if( !klass ) {
            throw new Error('extends klass is invalid');
        }
        klass.extends( properties ) ;
    } ;

    exports.implements    = function(constructor, properties ) {
        var klass    = Class.find( constructor ) ;
        if( !klass ) {
            throw new Error('implements klass is invalid');
        }
        klass.implements.push( properties ) ;
    } ;

    return exports ;
})();
