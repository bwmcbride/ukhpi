Rails.application.routes.draw do
  root "landing#index"
  resources :landing, only: [:index]

end
