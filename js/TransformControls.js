/**
 * original author: arodic / https://github.com/arodic
 * modified for Blockbench by jannisx11
 */

( function () {

	'use strict';

	var GizmoMaterial = function ( parameters ) {

		THREE.MeshBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.side = THREE.FrontSide;
		this.transparent = true;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setHex( parseInt(app_colors.accent.hex.replace('#', ''), 16) );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;

			}

		};

	};

	GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );
	GizmoMaterial.prototype.constructor = GizmoMaterial;


	var GizmoLineMaterial = function ( parameters ) {

		THREE.LineBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.transparent = true;
		this.linewidth = 1;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setHex( parseInt(app_colors.accent.hex.replace('#', ''), 16) );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;

			}

		};

	};

	GizmoLineMaterial.prototype = Object.create( THREE.LineBasicMaterial.prototype );
	GizmoLineMaterial.prototype.constructor = GizmoLineMaterial;


	var pickerMaterial = new GizmoMaterial( { visible: false, transparent: false } );


	THREE.TransformGizmo = function () {

		var scope = this;

		this.init = function () {

			THREE.Object3D.call( this );

			this.handles = new THREE.Object3D();
			this.pickers = new THREE.Object3D();
			this.planes = new THREE.Object3D();

			this.add( this.handles );
			this.add( this.pickers );
			this.add( this.planes );

			//// PLANES

			var planeGeometry = new THREE.PlaneBufferGeometry( 50, 50, 2, 2 );
			var planeMaterial = new THREE.MeshBasicMaterial( { visible: false, side: THREE.DoubleSide } );

			var planes = {
				"XY":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"YZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XYZE": new THREE.Mesh( planeGeometry, planeMaterial )
			};

			this.activePlane = planes[ "XYZE" ];

			planes[ "YZ" ].rotation.set( 0, Math.PI / 2, 0 );
			planes[ "XZ" ].rotation.set( - Math.PI / 2, 0, 0 );

			for ( var i in planes ) {

				planes[ i ].name = i;
				this.planes.add( planes[ i ] );
				this.planes[ i ] = planes[ i ];

			}

			//// HANDLES AND PICKERS

			var setupGizmos = function( gizmoMap, parent ) {

				for ( var name in gizmoMap ) {

					for ( i = gizmoMap[ name ].length; i --; ) {

						var object = gizmoMap[ name ][ i ][ 0 ];
						var position = gizmoMap[ name ][ i ][ 1 ];
						var rotation = gizmoMap[ name ][ i ][ 2 ];

						if (object.name.length === 0) {
							object.name = name;
						}
						object.renderDepth = 999

						if ( position ) object.position.set( position[ 0 ], position[ 1 ], position[ 2 ] );
						if ( rotation ) object.rotation.set( rotation[ 0 ], rotation[ 1 ], rotation[ 2 ] );

						parent.add( object );

					}

				}

			};

			setupGizmos( this.handleGizmos, this.handles );
			setupGizmos( this.pickerGizmos, this.pickers );

			// reset Transformations

			this.traverse( function ( child ) {

				if ( child instanceof THREE.Mesh ) {

					child.updateMatrix();

					var tempGeometry = child.geometry.clone();
					tempGeometry.applyMatrix( child.matrix );
					child.geometry = tempGeometry;

					child.position.set( 0, 0, 0 );
					child.rotation.set( 0, 0, 0 );
					child.scale.set( 1, 1, 1 );

				}

			} );

		};

		this.highlight = function ( axis ) {

			this.traverse( function( child ) {

				if ( child.material && child.material.highlight ) {

					if ( child.name === axis ) {

						child.material.highlight( true );

					} else {

						child.material.highlight( false );

					}

				}

			} );

		};

	};

	THREE.TransformGizmo.prototype = Object.create( THREE.Object3D.prototype );
	THREE.TransformGizmo.prototype.constructor = THREE.TransformGizmo;

	THREE.TransformGizmo.prototype.update = function ( rotation, eye ) {

		var vec1 = new THREE.Vector3( 0, 0, 0 );
		var vec2 = new THREE.Vector3( 0, 1, 0 );
		var lookAtMatrix = new THREE.Matrix4();

		this.traverse( function( child ) {

			if ( child.name.search( "E" ) !== - 1 ) {

				child.quaternion.setFromRotationMatrix( lookAtMatrix.lookAt( eye, vec1, vec2 ) );

			} else if ( child.name.search( "X" ) !== - 1 || child.name.search( "Y" ) !== - 1 || child.name.search( "Z" ) !== - 1 ) {

				child.quaternion.setFromEuler( rotation );

			}

		} );

	};

	THREE.TransformGizmoTranslate = function () {

		THREE.TransformGizmo.call( this );

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, 0.05, 0.2, 12, 1, false ) );
		mesh.position.y = 0.5;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );

		var lineXGeometry = new THREE.BufferGeometry();
		lineXGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  1, 0, 0 ], 3 ) );
		lineXGeometry.name = 'gizmo_x'

		var lineYGeometry = new THREE.BufferGeometry();
		lineYGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  0, 1, 0 ], 3 ) );
		lineYGeometry.name = 'gizmo_y'

		var lineZGeometry = new THREE.BufferGeometry();
		lineZGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  0, 0, 1 ], 3 ) );
		lineZGeometry.name = 'gizmo_z'

		this.handleGizmos = {
			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.r } ) ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: gizmo_colors.r } ) ) ]
			],
			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.g } ) ), [ 0, 0.5, 0 ] ],
				[	new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: gizmo_colors.g } ) ) ]
			],
			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.b } ) ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: gizmo_colors.b } ) ) ]
			]
		};

		this.pickerGizmos = {
			X: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0.6, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ]
			],
			Y: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0.6, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, 0.6 ], [ Math.PI / 2, 0, 0 ] ]
			]
		};

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis === "X" ) {
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];
			}

			if ( axis === "Y" ) {
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];
			}

			if ( axis === "Z" ) {
				this.activePlane = this.planes[ "XZ" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];
			}
		};

		this.init();

	};

	THREE.TransformGizmoTranslate.prototype = Object.create( THREE.TransformGizmo.prototype );
	THREE.TransformGizmoTranslate.prototype.constructor = THREE.TransformGizmoTranslate;

	THREE.TransformGizmoScale = function () {

		THREE.TransformGizmo.call( this );

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ) );
		mesh.position.y = 0.5;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );

		var lineXGeometry = new THREE.BufferGeometry();
		lineXGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  1, 0, 0 ], 3 ) );

		var lineYGeometry = new THREE.BufferGeometry();
		lineYGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  0, 1, 0 ], 3 ) );

		var lineZGeometry = new THREE.BufferGeometry();
		lineZGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0,  0, 0, 1 ], 3 ) );

		this.handleGizmos = {
			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.r } ) ), [ 0.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: gizmo_colors.r } ) ) ],

				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.r } ) ), [ -1.5, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: gizmo_colors.r } ) ), [ -1, 0, 0 ] ]
			],
			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.g } ) ), [ 0, 0.5, 0 ] ],
				[ new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: gizmo_colors.g} ) ) ],

				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.g } ) ), [ 0, -1.5, 0 ] ],
				[ new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: gizmo_colors.g } ) ), [ 0, -1, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.b } ) ), [ 0, 0, 0.5 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: gizmo_colors.b } ) ) ],

				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: gizmo_colors.b } ) ), [ 0, 0, -1.5 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: gizmo_colors.b } ) ), [ 0, 0, -1 ] ]
			]
		};
		this.handleGizmos.X[2][0].name = 'NX'
		this.handleGizmos.X[3][0].name = 'NX'
		this.handleGizmos.Y[2][0].name = 'NY'
		this.handleGizmos.Y[3][0].name = 'NY'
		this.handleGizmos.Z[2][0].name = 'NZ'
		this.handleGizmos.Z[3][0].name = 'NZ'

		this.pickerGizmos = {
			X: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0.6, 0, 0 ], [ 0, 0, - Math.PI / 2 ] ],
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ -0.6, 0, 0 ], [ 0, 0, Math.PI / 2 ] ]
			],
			Y: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0.6, 0 ] ],
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, -0.6, 0 ], [Math.PI / 1, 0, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, 0.6 ], [ Math.PI / 2, 0, 0 ] ],
				[ new THREE.Mesh( new THREE.CylinderBufferGeometry( 0.2, 0, 1, 4, 1, false ), pickerMaterial ), [ 0, 0, -0.6 ], [ - Math.PI / 2, 0, 0 ] ]
			]
		};
		this.pickerGizmos.X[1][0].name = 'NX'
		this.pickerGizmos.Y[1][0].name = 'NY'
		this.pickerGizmos.Z[1][0].name = 'NZ'

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis === "X" || axis === "NX" ) {

				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.y ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "XZ" ];
			}
			if ( axis === "Y" || axis === "NY" ) {

				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.z ) ) this.activePlane = this.planes[ "YZ" ];
			}
			if ( axis === "Z" || axis === "NZ" ) {

				this.activePlane = this.planes[ "XZ" ];
				if ( Math.abs( eye.x ) > Math.abs( eye.y ) ) this.activePlane = this.planes[ "YZ" ];
			}
		};
		this.init();

	};

	THREE.TransformGizmoScale.prototype = Object.create( THREE.TransformGizmo.prototype );
	THREE.TransformGizmoScale.prototype.constructor = THREE.TransformGizmoScale;

	THREE.TransformControls = function ( cam, domElement ) {

		THREE.Object3D.call( this );

		domElement = ( domElement !== undefined ) ? domElement : document;

		this.camera = cam
		this.objects = [];
		this.visible = false;
		this.translationSnap = null;
		this.rotationSnap = null;
		this.space = "world";
		this.size = 1;
		this.axis = null;
		this.hoverAxis = null;
		this.direction = true;
		this.last_valid_position = new THREE.Vector3();

		this.firstLocation = [0,0,0]


		var scope = this;

		var _mode = "translate";
		var _dragging = false;
		var _plane = "XY";
		var _gizmo = {

			"translate": new THREE.TransformGizmoTranslate(),
			"scale": new THREE.TransformGizmoScale()
		};

		for ( var type in _gizmo ) {

			var gizmoObj = _gizmo[ type ];

			gizmoObj.visible = ( type === _mode );
			this.add( gizmoObj );

		}

		
		this.children[0].children[0].children.forEach(function(s) {
			s.renderOrder = 999
		})
		this.children[1].children[0].children.forEach(function(s) {
			s.renderOrder = 999
		})

		//Vars
			var changeEvent = { type: "change" };
			var mouseDownEvent = { type: "mouseDown" };
			var mouseUpEvent = { type: "mouseUp", mode: _mode };
			var objectChangeEvent = { type: "objectChange" };

			var ray = new THREE.Raycaster();
			var pointerVector = new THREE.Vector2();

			var point = new THREE.Vector3();
			var offset = new THREE.Vector3();

			var rotation = new THREE.Vector3();
			var offsetRotation = new THREE.Vector3();
			var scale = 1;

			var lookAtMatrix = new THREE.Matrix4();
			var eye = new THREE.Vector3();

			var tempMatrix = new THREE.Matrix4();
			var tempVector = new THREE.Vector3();
			var tempQuaternion = new THREE.Quaternion();
			var unitX = new THREE.Vector3( 1, 0, 0 );
			var unitY = new THREE.Vector3( 0, 1, 0 );
			var unitZ = new THREE.Vector3( 0, 0, 1 );

			var quaternionXYZ = new THREE.Quaternion();
			var quaternionX = new THREE.Quaternion();
			var quaternionY = new THREE.Quaternion();
			var quaternionZ = new THREE.Quaternion();
			var quaternionE = new THREE.Quaternion();

			var oldRotationMatrix = new THREE.Vector4()
			var oldPositionArray = []
			var oldScaleArray = []
			var parentRotationArray = []
			var oldScale = 0;
			var oldScaleTranslation = 0;
			var positionSnapOffset = new THREE.Vector3()
			var previousValue = 0;
			var tempScale = 1;
			var oldOriginPosition = new THREE.Vector3()

			var parentRotationMatrix  = new THREE.Matrix4();
			var parentScale = new THREE.Vector3();

			var worldPosition = new THREE.Vector3();
			var worldRotation = new THREE.Euler();
			var worldRotationMatrix  = new THREE.Matrix4();
			var camPosition = new THREE.Vector3();
			var camRotation = new THREE.Euler();

		this.dispose = function () {


		};

		this.attach = function ( object ) {

			this.objects.push(object);
			this.visible = true;
			//this.update();
		};

		this.detach = function () {

			this.objects.length = 0
			this.visible = false;
			this.axis = null;
		};

		this.getMode = function () {

			return _mode;
		};

		this.setMode = function ( mode ) {

			if (mode === 'hidden') return;

			_mode = mode ? mode : _mode;

			if ( _mode === "scale" ) scope.space = "local";

			for ( var type in _gizmo ) _gizmo[ type ].visible = ( type === _mode );

			this.update();
			this.updateVisibleAxes()
			scope.dispatchEvent( changeEvent );
		};

		this.setTranslationSnap = function ( translationSnap ) {

			scope.translationSnap = translationSnap;
		};
		this.setSize = function ( size ) {

			scope.size = size;
			this.update();
			scope.dispatchEvent( changeEvent );
		};

		this.setSpace = function ( space ) {

			scope.space = space;
			this.update();
			scope.dispatchEvent(changeEvent);
		};

		this.cancel = function () {
		};

		this.updateVisibleAxes = function () {
			scope.children[ _mode === 'translate' ? 0 : 1 ].children[0].children.forEach(function(s, i) {
				if (!scope.camera.axis) {
					s.visible = true
				} else if (s.name.includes(scope.camera.axis.toUpperCase()) === true) {
					s.visible = false;
				} else {
					s.visible = true;
				}
			})
		};

		this.getScale = function() {

			var scope = Transformer;

			scope.camera.updateMatrixWorld();
			camPosition.setFromMatrixPosition( scope.camera.matrixWorld );
			camRotation.setFromRotationMatrix( tempMatrix.extractRotation( scope.camera.matrixWorld ) );
			//eye.copy( camPosition ).sub( worldPosition ).normalize();

			//this.position.copy( worldPosition );

			if ( scope.camera instanceof THREE.PerspectiveCamera ) {

				scale = worldPosition.distanceTo( camPosition )/6
					  * (settings.control_size.value / 20)
					  * (1000 / scope.camera.preview.height);

			} else if ( scope.camera instanceof THREE.OrthographicCamera ) {

				eye.copy( camPosition ).normalize();
				scale = (6 / scope.camera.zoom) * (settings.control_size.value / 20);

			}
			scale *= (1000+scope.camera.preview.height)/2000
			return scale;
		}

		this.setScale = function(sc) {

			Transformer.scale.set(sc,sc,sc)
		}

		this.update = function (object) {

			var scope = Transformer;

			if ( scope.objects.length == 0 && !selected_group) return;

			this.getScale()

			this.scale.set( scale, scale, scale );



			//Origin
			if ( scope.camera instanceof THREE.PerspectiveCamera ) {

				scale = rot_origin.getWorldPosition(new THREE.Vector3()).distanceTo( camPosition ) / 16 * (settings.origin_size.value / 20);

			} else if ( scope.camera instanceof THREE.OrthographicCamera ) {

				//eye.copy( camPosition ).normalize();
				scale = (6 / scope.camera.zoom) * (settings.origin_size.value / 50);

			}
			rot_origin.scale.set( scale, scale, scale );


			if ( scope.space === "local" && object) {

				worldRotation.setFromRotationMatrix( tempMatrix.extractRotation( object.matrixWorld ) );

				_gizmo[ _mode ].update( worldRotation, eye );

			} else if ( scope.space === "world" ) {

				_gizmo[ _mode ].update( new THREE.Euler(), eye );

			}

			_gizmo[ _mode ].highlight( scope.axis );
		};

		this.fadeInControls = function(frames) {
			if (!frames || typeof frames !== 'number') frames = 10
			var scope = Transformer;
			scale = this.getScale()
			var old_scale = Transformer.scale.x
			var diff = (scale - old_scale) / frames

			var i = 0;
			var interval = setInterval(function() {
				i++;
				Transformer.setScale(old_scale + i*diff)
				if (i >= frames) {
					clearInterval(interval)
				}
			}, 16)
		}

		this.setCanvas = function(canvas) {
			if (this.canvas) {
				this.canvas.removeEventListener( "mousedown", onPointerDown );
				this.canvas.removeEventListener( "touchstart", onPointerDown );

				this.canvas.removeEventListener( "mousemove", onPointerHover );
				this.canvas.removeEventListener( "touchmove", onPointerHover );

				this.canvas.removeEventListener( "mousemove", onPointerMove );
				this.canvas.removeEventListener( "touchmove", onPointerMove );

				this.canvas.removeEventListener( "mouseup", onPointerUp );
				this.canvas.removeEventListener( "mouseout", onPointerUp );
				this.canvas.removeEventListener( "touchend", onPointerUp );
				this.canvas.removeEventListener( "touchcancel", onPointerUp );
				this.canvas.removeEventListener( "touchleave", onPointerUp );
			}
			this.canvas = canvas;
			this.canvas.addEventListener( "mousedown", onPointerDown, false );
			this.canvas.addEventListener( "touchstart", onPointerDown, false );

			this.canvas.addEventListener( "mousemove", onPointerHover, false );
			this.canvas.addEventListener( "touchmove", onPointerHover, false );

			this.canvas.addEventListener( "mousemove", onPointerMove, false );
			this.canvas.addEventListener( "touchmove", onPointerMove, false );

			this.canvas.addEventListener( "mouseup", onPointerUp, false );
			this.canvas.addEventListener( "mouseout", onPointerUp, false );
			this.canvas.addEventListener( "touchend", onPointerUp, false );
			this.canvas.addEventListener( "touchcancel", onPointerUp, false );
			this.canvas.addEventListener( "touchleave", onPointerUp, false );
		}

		this.setCanvas(domElement)


		function onPointerHover( event ) {

			if ( scope.objects.length === 0 || ( event.button !== undefined && event.button !== 0 ) ) return;

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );

			if (intersect) {
				scope.dragging = true
			}

			if (_dragging === true) return;

			scope.hoverAxis = null;

			if ( intersect ) {
				scope.hoverAxis = intersect.object.name;
				if (scope.hoverAxis.toLowerCase() === scope.camera.axis) {
					scope.hoverAxis = null
				}
				event.preventDefault();
			}
			if ( scope.axis !== scope.hoverAxis ) {

				scope.axis = scope.hoverAxis;
				scope.update();
				scope.dispatchEvent( changeEvent );

			}

		}

		function onPointerDown( event ) {

			if ( scope.objects.length === 0 || _dragging === true || ( event.button !== undefined && event.button !== 0  ) ) return;
			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;
			if ( pointer.button === 0 || pointer.button === undefined ) {

				var intersect = intersectObjects( pointer, _gizmo[ _mode ].pickers.children );

				if ( intersect ) {
					scope.dragging = true

					if (intersect.object.name.toLowerCase() === scope.camera.axis) return;

					event.preventDefault();
					event.stopPropagation();

					scope.dispatchEvent( mouseDownEvent );

					scope.axis = intersect.object.name;

					scope.update();
					tempScale = 1
					oldScaleTranslation = 0;

					eye.copy( camPosition ).sub( worldPosition ).normalize();

					_gizmo[ _mode ].setActivePlane( scope.axis, eye );

					var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

					scope.last_valid_position.copy(scope.position)
					scope.hasChanged = false

					if ( planeIntersect ) {
						if (Toolbox.selected.id === 'resize_tool') {
							var axisnr = getAxisNumber(scope.axis.toLowerCase().replace('n', ''))
							selected.forEach(function(obj) {
								obj.oldScale = obj.size(axisnr)
							})
							Undo.initEdit({cubes: selected})
						} else if (Toolbox.selected.id === 'move_tool') {

							previousValue = undefined
							Undo.initEdit({cubes: selected})
						}

						Canvas.outlineObjects(selected)

						oldPositionArray.length = 0
						oldScaleArray.length = 0
						parentRotationArray.length = 0

						scope.objects.forEach(function(s) {

							oldPositionArray.push(new THREE.Vector3());
							oldScaleArray.push(new THREE.Vector3());
							oldOriginPosition = new THREE.Vector3()
							oldOriginPosition.copy(scope.position)


							oldPositionArray[ oldPositionArray.length-1 ].copy( s.position );
							oldScaleArray[ oldScaleArray.length-1 ].copy( s.scale );

							parentScale.setFromMatrixScale( tempMatrix.getInverse( s.parent.matrixWorld ) );
						})

						offset.copy( planeIntersect.point );

					}

				}

			}

			_dragging = true;

		}

		function onPointerMove( event ) {

			if ( scope.objects === undefined || scope.axis === null || _dragging === false || ( event.button !== undefined && event.button !== 0 ) ) return;

			scope.orbit_controls.hasMoved = true

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			var planeIntersect = intersectObjects( pointer, [ _gizmo[ _mode ].activePlane ] );

			if ( planeIntersect === false ) return;

			event.preventDefault();
			event.stopPropagation();

			point.copy( planeIntersect.point );
			point.sub( offset );
			if (!Blockbench.globalMovement) {
				var rotation = new THREE.Quaternion()
				scope.objects[0].getWorldQuaternion(rotation)
				point.applyQuaternion(rotation.inverse())
			}

			if (Toolbox.selected.id === 'resize_tool') {

				//Scale
				if (scope.axis.substr(0, 1) === 'N') {
					var axis = scope.axis.substr(1, 1).toLowerCase()
					scope.direction = false
				} else {
					var axis = scope.axis.toLowerCase()
					scope.direction = true
				}

				var axisNumber = getAxisNumber(axis)
				var snap_factor = canvasGridSize(event.shiftKey, event.ctrlKey)
				point[axis] = Math.round( point[axis] / snap_factor ) * snap_factor// * (useBedrockFlipFix(axis) ? -1 : 1)


				if (previousValue !== point[axis]) {

					selected.forEach(function(obj, i) {
						var mesh = scope.objects[i]
						var allow_negative = settings.negative_size.value

						if (scope.direction) { //Positive
							scaleCube(obj, limitNumber(obj.oldScale + point[axis], (allow_negative ? -32000 : 0), 32000), axisNumber)
						} else {
							scaleCubeNegative(obj, limitNumber(obj.oldScale - point[axis], (allow_negative ? -32000 : 0), 32000), axisNumber)
						}
						if (Blockbench.entity_mode === true) {
							Canvas.updateUV(obj)
						}
					})
					Canvas.updatePositions(true)
					centerTransformer()
					previousValue = point[axis]
					scope.hasChanged = true
				}

			} else if (Toolbox.selected.id === 'move_tool') {


				var axis = scope.axis.toLowerCase()
				var axisNumber = getAxisNumber(axis)
				var snap_factor = canvasGridSize(event.shiftKey, event.ctrlKey)
				point[axis] = Math.round( point[axis] / snap_factor ) * snap_factor// * (useBedrockFlipFix(axis) ? -1 : 1)

				if (previousValue === undefined) {
					previousValue = point[axis]

				} else if (previousValue !== point[axis]) {
					var difference = point[axis] - previousValue

					var overlapping = false
					if (settings.restricted_canvas.value && !Blockbench.entity_mode) {
						selected.forEach(function(obj) {
							overlapping = overlapping || (
								obj.to[axisNumber] + difference > 32 ||
								obj.to[axisNumber] + difference < -16 ||
								obj.from[axisNumber] + difference > 32 ||
								obj.from[axisNumber] + difference < -16
							)
						})
					}
					if (!overlapping) {
						selected.forEach(function(obj, i) {
							var mesh = scope.objects[i]
							var valx = obj.from[axisNumber]
							valx += difference
							moveCube(obj, valx, axisNumber)
						})
						Canvas.updatePositions(true)
						centerTransformer()
					}
					previousValue = point[axis]
					scope.hasChanged = true
				}
			}
			scope.dispatchEvent( changeEvent );
			scope.dispatchEvent( objectChangeEvent );

		}

		function onPointerUp( event ) {
			event.preventDefault(); // Prevent MouseEvent on mobile
			scope.dragging = false

			if ( event.button !== undefined && event.button !== 0 && event.button !== 2 ) return;

			if ( _dragging && scope.axis !== null ) {

				mouseUpEvent.mode = _mode;
				scope.dispatchEvent( mouseUpEvent );
				scope.orbit_controls.stopMovement()
				outlines.children.length = 0

				if (Toolbox.selected.id === 'resize_tool') {
					//Scale
					Canvas.updatePositions()
					selected.forEach(function(obj) {
						delete obj.oldScale
					})
					if (scope.hasChanged) {
						Undo.finishEdit('resize')
					}

				} else if (scope.axis !== null) {

					Canvas.updatePositions()
					selected.forEach(function(obj) {
						delete obj.oldPosition
					})
					if (scope.hasChanged) {
						Undo.finishEdit('move')
					}
				}

			}

			_dragging = false;

			if ( 'TouchEvent' in window && event instanceof TouchEvent ) {

				// Force "rollover"

				scope.axis = null;
				scope.update();
				scope.dispatchEvent( changeEvent );

			} else {

				onPointerHover( event );

			}

		}

		function intersectObjects( pointer, objects ) {

			var rect = scope.canvas.getBoundingClientRect();
			var x = ( pointer.clientX - rect.left ) / rect.width;
			var y = ( pointer.clientY - rect.top ) / rect.height;

			pointerVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1 );
			ray.setFromCamera( pointerVector, scope.camera );

			var intersections = ray.intersectObjects( objects, true );
			return intersections[ 0 ] ? intersections[ 0 ] : false;

		}

	};

	THREE.TransformControls.prototype = Object.create( THREE.Object3D.prototype );
	THREE.TransformControls.prototype.constructor = THREE.TransformControls;

}() );

THREE.Euler.prototype.inverse = function () {

	var q = new THREE.Quaternion();

	return function inverse() {

		return this.setFromQuaternion( q.setFromEuler( this ).inverse() );

	};

}();
THREE.Vector3.prototype.removeEuler = function (euler) {

	var normal = new THREE.Vector3(0, 0, 1)

	return function removeEuler(euler) {

		this.applyAxisAngle(normal,			  -euler.z)
		this.applyAxisAngle(normal.set(0, 1, 0), -euler.y)
		this.applyAxisAngle(normal.set(1, 0, 0), -euler.x)
		return this;

	};

}();