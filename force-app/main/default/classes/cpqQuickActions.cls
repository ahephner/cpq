public class cpqQuickActions {
    public ApexPages.StandardSetController ctl {get; set;}
    public cpqQuickActions( ApexPages.StandardSetController controller ) {
         this.ctl = controller;
  		  
    }
    public PageReference newOpp(){
        string url;
        try{
        	id userId = UserInfo.getUserId();
            Date cd = System.today() + 14;
             
       		List<Sales_Rep__c> rep = [select id, Warehouse__c from Sales_Rep__c where Salesforce_User__c =: userID limit 1];
            if(rep.size()>0){
                //for deployment need to get the right recordtypeid for full: 01275000000CgcYAAS
                //for cpq: 0121D000003qH6eQAE
                //production:0122M000001ElAYQA0
                   Opportunity opp = new Opportunity(name='New Opp ',CloseDate=cd,Expiration_Date_Editable__c=cd, RecordTypeId = '01275000000CgcYAAS',Warehouse__c = rep[0].Warehouse__c,
                                             		Sales_Rep__c = rep[0].Id,Pricebook2Id = '01s410000077vSKAAY', Stagename='Working'); 
                	insert opp;
                	url = opp.Id;
            }else{
                system.debug('no rep');
                Opportunity nonRep = new Opportunity(name='New Opp ',CloseDate=cd, Expiration_Date_Editable__c=cd, RecordTypeId = '01275000000CgcYAAS',
                                             	     Pricebook2Id = '01s410000077vSKAAY', Stagename='Working');
                insert nonRep; 
                url = nonRep.Id; 
            }

        }catch(Exception e){
            ApexPages.addMessages(e); 
            return null;
        }

       return new PageReference('/lightning/r/Opportunity/'+url+'/view'); 
    }
}