//global vars
var ll;
var postCount = 0;
var isMobile = false; //initiate as false

//main document ready function
$(document).ready(function () {

  // device detection
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    isMobile = true;
   }

  $('#searchclear').on('click', function () {
    resetSearch();
  });

  $("#untappdRatingFilter").on("input focusout", function() {
    $('#ratingFilterValue').text($(this).val());
    filterByUntappdRating($(this).val());
  });

  $('.selectAllToggle').click(function () {
    var divId = $(this).attr('id');
    var buttonName = $(this).attr('id').replace('Toggle', '');

    ($(this).text() === 'De-Select All') ? $(this).text('Select All') : $(this).text('De-Select All');
    $(this).data('selected', !$(this).data('selected'));
    var selected = $('#' + divId).data('selected');

    $('#' + buttonName + 'Div').find('input').each(function () {
      $(this).prop('checked', selected);
      $(this).trigger('change');
    });
    
    ll.update();

  });

  $('.venueToggles').on('change', "input[type='checkbox']", function (e) {
    toggleVenues(this);
  });

  $('#searchString').keyup(function (e) {
    clearTimeout($.data(this, 'timer'));
    if (e.keyCode == 13)
      search(true);
    else
      $(this).data('timer', setTimeout(search, 500));
    return false;
  });

  $('#resetFilters').click(function () {
    resetSearch();
  });

  //expand/collapse text
  $('#data').on('click', '.expando-text', function (e) {
    $(this).toggleClass("expander");
  });

  //show modal on click
  $('#data').on('click', '.card-img-top', function (e) {
     openModal($(this).parent().parent().attr('id'));
  });

  //show filters modal
  $('#filterToggle').on('click', function () {
    $('#filterModal').modal('show');
  });

  ll = new LazyLoad();

  //get feed
  getJuice();

  //refresh every 10 mins
  // setInterval(function () { getJuice(); }, 600000);

  //get untappd rating filter from cookie if exists
  filterByUntappdRating(getCookie("untappdRatingFilter"));
});


function toggleVenues(data) {
  var venue = $(data).data('venue');
  var checked = data.checked;
  var type = $(data).parents().eq(1).attr('id').split('Div')[0];

  console.log(venue,checked,type)

  $('#data').find('.' + type + 'post').each(function (i, item) {
    
    if ($(item).find('.' + type + 'venue').data('venue') === venue) {
      if (checked) $(item).show();
      else $(item).hide();
    }
  });
}

function getNeighborPost(id,direction) {
  var postID = parseInt(id.split('-')[1]);
  var nextPostID,visible;
  //console.log('getVisiblePost',id,direction)

  if (direction === 'next') {
    //were at the end
    if (postID === postCount) return id;
    nextPostID = 'juiceIndex-' + (postID+1);
    visible = $('#' + nextPostID).find('.card-img-top').parent().parent().is(":visible");
    
    if (visible) return nextPostID;
    else return getNeighborPost(nextPostID,direction);
  }
  if (direction === 'previous') {
    //were at the beginning
    if (postID === 1) return id;
    nextPostID = 'juiceIndex-' + (postID-1);
    visible = $('#' + nextPostID).find('.card-img-top').parent().parent().is(":visible");
      
    if (visible) return nextPostID;
    else return getNeighborPost(nextPostID,direction);
  }
}

function openModal(id) {

  console.log('open modal:',id,$('#' + id).find('.card-title').html())

  var data = $('#' + id).find('.card-img-top');

  //check if this is an untappd item click
  if ($(data).attr('class').indexOf('untappd-img-top') != -1) {
    // $('#unifiedBodyTop').html('<iframe src="' + $(data).data('url') + '" id="untappdIframe" style="zoom:0.60" frameborder="0" width="99.6%"></iframe>'); 
    // $('#untappdIframe').attr("height", $('#unifiedModal').height());   

    $('#unifiedBodyTop').html('<img class="card-img-top untappd-img" src="' + $(data).data('src') + '" id="unifiedImage" style=""></img>');
  }

  //otherwise assume instagram or twitter
  else {
    $('#unifiedBodyTop').html('<img class="card-img-top" src="' + $(data).data('fullsizeimageurl') + '" id="unifiedImage"></img>');
  }
  
  $('#unifiedTitle').text($(data).data('venue'));
  $('#unifiedLogo').attr('src', $(data).data('logo'));

  //if its an untappd post add the beer name and rating
  if ($('#' + id).hasClass('untappdpost')) {
    $('#unifiedBodyBottom').html('<h5>' + $('#' + id).find('.card-title').html() + '</h5>');
    $('#unifiedBodyBottom').append('<p>' + $('#' + id).find('.modal-text').html() + '</p>');
    $('#unifiedBodyBottom').append('<p>' + $('#' + id).find('.card-text').html() + '</p>');
  }

  else {
    $('#unifiedBodyBottom').html('<p>' + $('#' + id).find('.modal-text').html() + '</p>');
    $('#unifiedBodyBottom').append('<p>' + $('#' + id).find('.card-text').html() + '</p>');
  }



  // $('#unifiedBodyBottom').append('<span id="beerName">' + $(data).data('name') + '</span></a><span class="badge badge-warning rating ml-2">' + $(data).data('rating') + '</span>');
  $('#unifiedFooter').html('<small class="time" data-time="' + $(data).data('time') + '"> Posted: ' + timeSince(new Date($(data).data('time'))) + ' ago</small>');
  $('#unifiedModal').modal('show'); 

  var previousPostID = getNeighborPost(id,'previous');
  var nextPostID = getNeighborPost(id,'next');
  console.log('previous post:',previousPostID,'current post:',id,'next post:',nextPostID)

  //bind arrow key listerners
  $("#unifiedModal").off('keydown').on('keydown', function(e) {
    switch(e.which) {
        case 37: // left
        openModal(previousPostID);
        break;

        case 39: // right
        openModal(nextPostID);
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  });

  //add chevron click listeners
  $('#previousPost').off('click').on('click', function (e) { 
    openModal(previousPostID);
  });
  $('#nextPost').off('click').on('click', function (e) {
    openModal(nextPostID);
  });

  //add touch swipe listeners
  $("#unifiedModal").swipe({
    swipeRight: function(event, direction, distance, duration, fingerCount, fingerData) {
      openModal(previousPostID);
    },
    swipeLeft: function(event, direction, distance, duration, fingerCount, fingerData) {
      openModal(nextPostID);
    }, 
    allowPageScroll: "vertical",
  });
}

function search(force) {
  var existingString = $('#searchString').val().toLowerCase()
  if (!force && existingString.length < 1) {
    resetSearch();
    return; //wasn't enter, not > 2 char
  }
  $('#data').find('.juicepost').each(function (i, item) {
    var allText = $(item).find('div').text().toLowerCase();
    if (allText.indexOf(existingString) !== -1) $(item).show()
    else $(item).hide();
  });
}

function resetSearch() {
  $('#searchString').val('');
  $('#data').find('.juicepost').each(function (i, item) {
    $(item).show();
  });
  filterByUntappdRating($('#ratingFilterValue').text());
}

function filterByUntappdRating(filterValue) {

  //set cookie with filter value
  setCookie("untappdRatingFilter",filterValue,999);

  //then loop over checked untappd toggles
  $('#untappdDiv.venueToggles input[type=checkbox], #beermenusDiv.venueToggles input[type=checkbox]').each(function (i, checkbox) {
    //console.log('here',checkbox)
    var toggleVenue = $(this).data('venue');
    var checked = this.checked;

    //loop over untappd posts
    $('#data').find('.untappdpost, .beermenuspost').each(function (i, item) {
      var postVenue = $(item).find('.untappdvenue, .beermenusvenue').data('venue');
      var rating = parseFloat($(item).find('.rating').text().trim());
      
      var beer = $(item).find('.card-title').text();
    
      if (postVenue === toggleVenue  && checked) {
        //console.log('rating',rating, postVenue, toggleVenue)
        if (rating < filterValue) {
          
          $(item).hide();
        }
        else {
          $(item).show();

          //filter geoJSON here


        }
      }
    });
  });

  //update lazy loader after everything is done
  ll.update();
}

function getJuice() {

  $.ajax({
    type: "GET",
    url: "../juice",
    success: function (data) {
      console.log('response:',data);

      var result = data;

      $('#data').empty();

      $.each(result, function (index, value) {
        console.log('now parsing:', index);

        if (index === 'instagram') {
          $.each(value, function (index, post) {
            //console.log('insta',post);

            //add toggle to filter modal
            if ($('#instagramDiv').find('.instagram-toggle').text().indexOf(post.venue) === -1) {
              $('#instagramDiv').append('<div class="ml-2 instagram-toggle custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="instaCheck' + index + '" data-venue="' + post.user + '" checked><label class="custom-control-label" for="instaCheck' + index + '">' + post.venue + '</label></div>');
            }

            //linkify hashtags and ats in post text
            var newText = post.text.replace(/#(\w+)/g, "<a href='https://instagram.com/tags/$1' target='_blank'>$&</a>").replace(/@(\w+)/g, "<a href='https://instagram.com/$1' target='_blank'>$&</a>");

            //create post
            var postContent = '<div class="juicepost instagrampost col-6 col-md-4 col-lg-2 mt-4"> <div class="card"> <img class="instagramImage card-img-top" data-src="' + post.thumbnailURL + '" data-fullSizeImageURL="' + post.imageURL + '" data-venue="' + post.user + '" data-logo="' + post.venueLogoURL + '" data-time="' + post.date + '"> <div class="card-block"> <user class="profile">	<img src="' + post.venueLogoURL + '" class="profile-avatar" alt=""> </user>  <div class="expander instagramvenue expando-text modal-text mt-3" data-venue="' + post.user + '"> ' + newText  + '</div> <div class="card-text"><a href="https://www.instagram.com/' + post.user + '" target="_blank">' + post.venue + '</a></div> </div> <div class="card-footer">	<small class="time" data-time="' + post.date + '"> Posted: ' + timeSince(new Date(post.date)) + ' ago</small> </div>	</div> </div>';

            $('#data').append($(postContent));

          });
        }

        if (index === 'twitter') {
          $.each(value, function (index, post) {
            //console.log('twitter',post.imageURL);

            if (post.imageURL == 'undefined') post.imageURL = post.userPhotoURL;

            if ($('#twitterDiv').find('.twitter-toggle').text().indexOf(post.venue) === -1) {
              $('#twitterDiv').append('<div class="ml-2 twitter-toggle custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="twitterCheck' + index + '" data-venue="' + post.user + '" checked><label class="custom-control-label" for="twitterCheck' + index + '">' + post.venue + '</label></div>');
            }

            //create post
            var postContent = '<div class="juicepost twitterpost col-6 col-md-4 col-lg-2 mt-4"> <div class="card"> <img class="twitterImage card-img-top" data-src="' + post.imageURL + '" data-fullSizeImageURL="' + post.imageURL + '" data-venue="' + post.user + '" data-logo="' + post.userPhotoURL + '" data-time="' + post.date + '"> <div class="card-block"> <user class="profile">	<img data-src="' + post.userPhotoURL + '" class="profile-avatar" alt=""> </user>  <div class="expander expando-text twittervenue modal-text mt-3" data-venue="' + post.user + '"> ' + post.text + '</div> <div class="card-text"><a href="https://www.twitter.com/' + post.user + '" target="_blank">' + post.venue + '</a></div> </div> <div class="card-footer">	<small class="time" data-time="' + post.date + '"> Posted: ' + timeSince(new Date(post.date)) + ' ago</small> </div>	</div> </div>';

            $('#data').append(postContent);

          });
        }

        if (index === 'untappd') {
          $.each(value, function (index, post) {
            console.log('untappd',post, 'isMobile',isMobile);

            if ($('#untappdDiv').find('.untappd-toggle').text().indexOf(post.venue) === -1) {
              $('#untappdDiv').append('<div class="ml-2 untappd-toggle custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="untappdCheck' + index + '" data-venue="' + post.venue + '" checked><label class="custom-control-label" for="untappdCheck' + index + '">' + post.venue + '</label></div>');

              createGeoJSON(post);
            }

            //take care of 'N/A' values
            if (post.rating == 'N/A') {
              post.rating = 0.00;
            }

            //default filtering
            var display = '';
            if (parseFloat(post.rating) < parseFloat($('#ratingFilterValue').text())) {
              //console.log('hiding',post.name);
              display = 'style="display:none;"';
            }

            post.text = $('<div id="beerInfo" class="meta"><div id="beerBrewery"> ' + post.brewery + '</div> <div id="beerStyle"> ' + post.style + '</div> <div id="beerABVIBU"> ' + post.ABV + ' ABV • ' + post.IBU + ' IBU</div> <div id="beerPrice"> ' + post.prices.replace(/USD/g, '').split('|').join(' </br> ') + '</div> </div>').text();

            //rewrite untappd URLs if mobile
            if (isMobile) {
              //post.venueUntappdLogoURL.replace('ht')
            }

            //create post
            var postContent = '<div ' + display + ' class="juicepost untappdpost col-6 col-md-4 col-lg-2 mt-4"> <div class="card"> <img class="untappd-img-top card-img-top" data-src="' + post.beerLogoURL + '" data-url="' + post.beerUntappdURL + '" data-venue="' + post.venue + '" data-logo="' + post.venueUntappdLogoURL + '" data-time="' + post.date + '" data-name="' + post.name + '" data-rating="' + post.rating + '"><div class="card-block"> <venue class="profile untappdvenue" data-venue="' + post.venue + '">	<img src="' + post.venueUntappdLogoURL + '"  class="profile-avatar" alt=""> </venue> <h5 class="card-title mt-3"><a href="' + post.beerUntappdURL + '" target="_blank"><span id="beerName">' + post.name + '</span></a><span class="badge badge-warning rating ml-2">' + post.rating + '</span></h5><div class="modal-text" id="beerInfo"><div id="beerBrewery"> ' + post.brewery + '</div> <div id="beerStyle"> ' + post.style + '</div> <div id="beerABVIBU"> ' + post.ABV + ' ABV • ' + post.IBU + ' IBU</div> <div id="beerPrice"> ' + post.prices.replace(/USD/g, '').split('|').join(' </br> ') + '</div> </div><div class="card-text"><a href="' + post.venueUntappdURL + '" target="_blank">' + post.venue + '</a></div> </div> <div class="card-footer">	<small class="time" data-time="' + post.date + '"> Posted: ' + timeSince(new Date(post.date)) + ' ago</small> </div>	</div> </div>';

            $('#data').append(postContent);
          });
        }

        if (index === 'beermenus') {
          $.each(value, function (index, post) {
            //console.log('beermenus',post);

            if ($('#beermenusDiv').find('.beermenus-toggle').text().indexOf(post.venue) === -1) {
              $('#beermenusDiv').append('<div class="ml-2 beermenus-toggle custom-control custom-checkbox"><input type="checkbox" class="custom-control-input" id="beermenusCheck' + index + '" data-venue="' + post.venue + '" checked><label class="custom-control-label" for="beermenusCheck' + index + '">' + post.venue + '</label></div>');

              createGeoJSON(post);
            }

            //take care of 'N/A' values
            if (post.rating == 'N/A') {
              post.rating = 0.00;
            }

            //default filtering
            var display = '';
            if (parseFloat(post.rating) < parseFloat($('#ratingFilterValue').text())) {
              //console.log('hiding',post.name);
              display = 'style="display:none;"';
            }

            post.text = $('<div id="beerInfo" class="meta"><div id="beerBrewery"> ' + post.brewery + '</div> <div id="beerStyle"> ' + post.style + '</div> <div id="beerABVIBU"> ' + post.ABV + ' ABV • ' + post.IBU + ' IBU</div> <div id="beerPrice"> ' + post.prices.replace(/USD/g, '').split('|').join(' </br> ') + '</div> </div>').text();

            //create post
            var postContent = '<div ' + display + ' class="juicepost beermenuspost col-6 col-md-4 col-lg-2 mt-4"> <div class="card"> <img class="untappd-img-top card-img-top" data-src="' + post.beerLogoURL + '" data-url="' + post.beerUntappdURL + '" data-venue="' + post.venue + '" data-logo="' + post.venueUntappdLogoURL + '" data-time="' + post.date + '"><div class="card-block"> <venue class="profile beermenusvenue" data-venue="' + post.venue + '">	<img src="' + post.beermenusLogoURL + '"  class="profile-avatar" alt=""> </venue> <h5 class="card-title mt-3"><a href="' + post.beerUntappdURL + '" target="_blank"><span id="beerName">' + post.name + '</span></a><span class="badge badge-warning rating ml-2">' + post.rating + '</span></h5><div class="modal-text" id="beerInfo"><div id="beerBrewery"> ' + post.brewery + '</div> <div id="beerStyle"> ' + post.style + '</div> <div id="beerABVIBU"> ' + post.ABV + ' ABV • ' + post.IBU + ' IBU</div> <div id="beerPrice"> ' + post.prices.replace(/USD/g, '').split('|').join(' </br> ') + '</div> </div><div class="card-text"><a href="' + post.beermenusVenueURL + '" target="_blank">' + post.venue + '</a></div> </div> <div class="card-footer">	<small class="time" data-time="' + post.date + '"> Posted: ' + timeSince(new Date(post.date)) + ' ago</small> </div>	</div> </div>';

            $('#data').append(postContent);
          });
        }

        //update lazy loader after each item
        ll.update();
      });

      //sort posts by date
      $('#data .juicepost').sort(sortDescending).appendTo('#data');

      //append IDs to date-ordered posts
      $(".juicepost").each(function(){ 
        postCount +=1;
        $(this).attr('id','juiceIndex-' + postCount);
      });

      //update lazy loader after everything is done
      ll.update();

    }
  });

}

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
}

function sortDescending(a, b) {
  return new Date($(b).find(".time").data('time')) - new Date($(a).find(".time").data('time'));
}

function setCookie(name,value,days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  document.cookie = name+"="+value+expires+"; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
