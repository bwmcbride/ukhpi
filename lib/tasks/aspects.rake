require 'json'

namespace :ukhpi do
  desc "Generate a client-side version of the aspects model"
  task aspects: [:aspects_js, :move_aspects_js_file]

  desc "Translate the aspects model to JavaScript"
  task aspects_js: :environment do
    puts "Generating aspects.js ..."
    data_model = DataModel.new

    File.open( "aspects.js", "w") do |file|
      file << "// autogenerated by 'rake ukhpi:aspects'\n"
      file << <<EOL
define( [], function() {
  "use strict";
  return {
EOL

      sep = "  "
      data_model
        .measures
        .sort {|m0,m1| m0.local_name <=> m1.local_name}
        .each do |measure|
          file << "#{sep}  #{measure.local_name}: {"
          file << "uri: \"#{measure.uri}\", "
          file << "label: \"#{measure.label}\", "
          file << "unitType: \"#{measure.unit_type}\""
          file << "}"
          sep = ",\n  "
        end

      file << <<EOL

  };
} );
EOL
    end
  end

  desc "Move the aspects.js file to the right location"
  task move_aspects_js_file: :environment do
    puts "Moving aspects.js ..."
    File.rename( "aspects.js", "app/assets/javascripts/aspects.js" )
  end
end
